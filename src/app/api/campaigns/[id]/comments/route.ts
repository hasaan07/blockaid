/**
 * /api/campaigns/[id]/comments
 *   POST — any authenticated user posts a comment
 *   GET  — anyone can read comments (hides soft-deleted ones)
 */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Campaign } from "@/models/Campaign";
import { Comment } from "@/models/Comment";
import { requireAuth } from "@/middleware/requireAuth";
import { createCommentSchema } from "@/lib/validation";
import { User } from "@/models/User";

// Ensure the User model is registered for populate("owner") on serverless.
void User;

interface Params {
  params: Promise<{ id: string }>;
}

function isValidObjectId(id: string) {
  return /^[a-f0-9]{24}$/.test(id);
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid campaign id" }, { status: 400 });
  }

  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const parsed = createCommentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    await connectDB();
    const campaign = await Campaign.findOne({ _id: id, deletedAt: null });
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const comment = await Comment.create({
      campaign: id,
      author: auth.user.sub,
      body: parsed.data.body,
    });

    return NextResponse.json(
      {
        id: String(comment._id),
        body: comment.body,
        createdAt: comment.createdAt,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Post comment error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid campaign id" }, { status: 400 });
  }

  try {
    await connectDB();
    const items = await Comment.find({ campaign: id, deletedAt: null })
      .sort({ createdAt: -1 })
      .populate("author", "name email")
      .lean();

    return NextResponse.json({
      items: items.map((c) => ({
        id: String(c._id),
        body: c.body,
        author: c.author,
        createdAt: c.createdAt,
      })),
      count: items.length,
    });
  } catch (err) {
    console.error("List comments error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
