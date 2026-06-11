import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Campaign } from "@/models/Campaign";
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
      Campaign.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("owner", "name email")
        .lean(),
      Campaign.countDocuments({}),
    ]);

    return NextResponse.json({
      items: items.map((c) => ({
        id: String(c._id),
        title: c.title,
        category: c.category,
        contractAddress: c.contractAddress,
        receivedWei: c.receivedWei,
        goalWei: c.goalWei,
        status: c.status,
        deletedAt: c.deletedAt,
        owner: c.owner,
        createdAt: c.createdAt,
      })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Admin list campaigns error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
