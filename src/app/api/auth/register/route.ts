/**
 * POST /api/auth/register
 *
 * Body: { name, email, password }
 * Returns: 201 + { id, name, email, role } and sets the auth cookie.
 *
 * Errors:
 *   400 — invalid input
 *   409 — email already registered
 *   500 — server error
 */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { hashPassword, signToken, setAuthCookie } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }
    const { name, email, password } = parsed.data;

    await connectDB();

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const created = await User.create({ name, email, passwordHash });

    const token = signToken({
      sub: String(created._id),
      email: created.email,
      role: created.role,
    });
    await setAuthCookie(token);

    return NextResponse.json(
      {
        id: String(created._id),
        name: created.name,
        email: created.email,
        role: created.role,
      },
      { status: 201 }
    );
  } catch (err) {
    // Catch MongoDB duplicate key error in case of race condition between findOne and create.
    if (err && typeof err === "object" && "code" in err && err.code === 11000) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }
    console.error("Register error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
