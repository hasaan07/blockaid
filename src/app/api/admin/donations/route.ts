import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Donation } from "@/models/Donation";
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
      Donation.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("campaign", "title contractAddress")
        .lean(),
      Donation.countDocuments({}),
    ]);

    return NextResponse.json({
      items: items.map((d) => ({
        id: String(d._id),
        campaign: d.campaign,
        backerWallet: d.backerWallet,
        amountWei: d.amountWei,
        txHash: d.txHash,
        createdAt: d.createdAt,
      })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Admin list donations error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
