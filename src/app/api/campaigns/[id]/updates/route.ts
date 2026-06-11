/**
 * /api/campaigns/[id]/updates
 *   POST — campaign owner posts an update (auth + ownership)
 *   GET  — anyone can list updates for a campaign (public)
 */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Campaign } from "@/models/Campaign";
import { Update } from "@/models/Update";
import { requireAuth } from "@/middleware/requireAuth";
import { createUpdateSchema } from "@/lib/validation";

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
    const parsed = createUpdateSchema.safeParse(body);
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
    if (String(campaign.owner) !== auth.user.sub) {
      return NextResponse.json(
        { error: "Only the campaign owner can post updates" },
        { status: 403 }
      );
    }

    const update = await Update.create({
      campaign: id,
      author: auth.user.sub,
      body: parsed.data.body,
    });

    return NextResponse.json(
      {
        id: String(update._id),
        body: update.body,
        createdAt: update.createdAt,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Post update error:", err);
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
    const items = await Update.find({ campaign: id })
      .sort({ createdAt: -1 })
      .populate("author", "name email")
      .lean();

    return NextResponse.json({
      items: items.map((u) => ({
        id: String(u._id),
        body: u.body,
        author: u.author,
        createdAt: u.createdAt,
      })),
      count: items.length,
    });
  } catch (err) {
    console.error("List updates error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
