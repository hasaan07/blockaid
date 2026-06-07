/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated user's profile.
 * Used by the frontend to check "am I logged in?" on page load.
 *
 * Returns:
 *   200 + { id, name, email, role, bio, walletAddress }
 *   401 — not authenticated
 */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { requireAuth } from "@/middleware/requireAuth";

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    await connectDB();
    const user = await User.findById(auth.user.sub);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      bio: user.bio,
      walletAddress: user.walletAddress,
    });
  } catch (err) {
    console.error("Me error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
