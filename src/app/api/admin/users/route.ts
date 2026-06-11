import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { requireAuth } from "@/middleware/requireAuth";

export async function GET(req: Request) {
  const auth = await requireAuth({ role: "admin" });
  if (auth instanceof NextResponse) return auth;

  try {
    const url = new URL(req.url);
    const page = Math.max(Number(url.searchParams.get("page") || "1"), 1);
    const limit = Math.min(Number(url.searchParams.get("limit") || "20"), 100);
    const skip = (page - 1) * limit;

    await connectDB();
    const [items, total] = await Promise.all([
      User.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments({}),
    ]);

    return NextResponse.json({
      items: items.map((u) => ({
        id: String(u._id),
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
      })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Admin list users error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
