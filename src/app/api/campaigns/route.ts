/**
 * /api/campaigns
 *   POST  — create a new campaign (auth required)
 *   GET   — list campaigns with pagination, filter, sort, search
 *
 * Note: POST stores ONLY off-chain metadata. The on-chain deployment
 * happens in the frontend (Phase 7) which then POSTs the resulting
 * contractAddress here.
 */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Campaign } from "@/models/Campaign";
import { requireAuth } from "@/middleware/requireAuth";
import { createCampaignSchema, listCampaignsQuerySchema } from "@/lib/validation";

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const parsed = createCampaignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    await connectDB();

    const created = await Campaign.create({
      ...parsed.data,
      owner: auth.user.sub,
      deadline: new Date(parsed.data.deadline),
      receivedWei: "0",
      status: "active",
    });

    return NextResponse.json(
      {
        id: String(created._id),
        title: created.title,
        category: created.category,
        contractAddress: created.contractAddress,
        deadline: created.deadline,
        goalWei: created.goalWei,
        status: created.status,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === 11000) {
      return NextResponse.json(
        { error: "A campaign with this contract address already exists" },
        { status: 409 }
      );
    }
    console.error("Create campaign error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const raw = Object.fromEntries(url.searchParams.entries());
    const parsed = listCampaignsQuerySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.issues },
        { status: 400 }
      );
    }
    const { page, limit, category, q, sort, status, owner } = parsed.data;

    await connectDB();

    // Build query
    const filter: Record<string, unknown> = { deletedAt: null };
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (owner) filter.owner = owner;
    if (q) filter.$text = { $search: q };

    // Sort
    const sortMap: Record<string, Record<string, 1 | -1>> = {
      newest: { createdAt: -1 },
      ending_soon: { deadline: 1 },
      most_funded: { receivedWei: -1 },
    };

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Campaign.find(filter)
        .sort(sortMap[sort])
        .skip(skip)
        .limit(limit)
        .populate("owner", "name email")
        .lean(),
      Campaign.countDocuments(filter),
    ]);

    return NextResponse.json({
      items: items.map((c) => ({
        id: String(c._id),
        title: c.title,
        description: c.description,
        category: c.category,
        contractAddress: c.contractAddress,
        imageCid: c.imageCid,
        goalWei: c.goalWei,
        receivedWei: c.receivedWei,
        deadline: c.deadline,
        status: c.status,
        owner: c.owner,
        createdAt: c.createdAt,
      })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("List campaigns error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
