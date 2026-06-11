/**
 * DELETE /api/admin/comments/[id]
 *
 * Admin-only soft delete of a comment. Records an AdminLog entry.
 */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Comment } from "@/models/Comment";
import { AdminLog } from "@/models/AdminLog";
import { requireAuth } from "@/middleware/requireAuth";
import { adminActionSchema } from "@/lib/validation";

interface Params {
  params: Promise<{ id: string }>;
}

function isValidObjectId(id: string) {
  return /^[a-f0-9]{24}$/.test(id);
}

export async function DELETE(req: Request, { params }: Params) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid comment id" }, { status: 400 });
  }

  const auth = await requireAuth({ role: "admin" });
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = adminActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    await connectDB();
    const comment = await Comment.findById(id);
    if (!comment || comment.deletedAt) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    comment.deletedAt = new Date();
    await comment.save();

    await AdminLog.create({
      admin: auth.user.sub,
      action: "delete_comment",
      targetType: "Comment",
      targetId: comment._id,
      reason: parsed.data.reason,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin delete comment error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
