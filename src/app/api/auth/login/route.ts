/**
 * POST /api/auth/login
 *
 * Body: { email, password }
 * Returns: 200 + { id, name, email, role } and sets the auth cookie.
 *
 * Errors:
 *   400 — invalid input
 *   401 — invalid credentials (intentionally vague — never reveal whether the email or password was wrong)
 *   500 — server error
 */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { verifyPassword, signToken, setAuthCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }
    const { email, password } = parsed.data;

    await connectDB();

    // Explicitly include passwordHash since it's select: false by default.
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = signToken({
      sub: String(user._id),
      email: user.email,
      role: user.role,
    });
    await setAuthCookie(token);

    return NextResponse.json({
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
