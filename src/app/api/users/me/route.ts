/**
 * PATCH /api/users/me
 *
 * Body: any subset of { name, bio, walletAddress }
 * Returns: 200 + updated user
 *
 * Email and password cannot be changed here (deliberately — those need their own
 * dedicated flows with re-authentication / email verification, which are
 * apportioned to future versions per SRS Section 2.2.6).
 */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { requireAuth } from "@/middleware/requireAuth";
import { updateProfileSchema } from "@/lib/validation";

export async function PATCH(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    await connectDB();
    const updated = await User.findByIdAndUpdate(
      auth.user.sub,
      { $set: parsed.data },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: String(updated._id),
      name: updated.name,
      email: updated.email,
      role: updated.role,
      bio: updated.bio,
      walletAddress: updated.walletAddress,
    });
  } catch (err) {
    console.error("Update profile error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
