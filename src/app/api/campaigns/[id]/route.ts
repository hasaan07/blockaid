/**
 * /api/campaigns/[id]
 *   GET    — fetch campaign by id (public)
 *   PATCH  — update off-chain fields (owner only)
 *   DELETE — soft-delete (owner only, only if no donations)
 *
 * Important: on-chain fields (goal, deadline, contractAddress, receivedWei)
 * are NOT editable here. Those are immutable on-chain after deployment.
 */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Campaign } from "@/models/Campaign";
import { Donation } from "@/models/Donation";
import { requireAuth } from "@/middleware/requireAuth";
import { updateCampaignSchema } from "@/lib/validation";

interface Params {
  params: Promise<{ id: string }>;
}

function isValidObjectId(id: string) {
  return /^[a-f0-9]{24}$/.test(id);
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid campaign id" }, { status: 400 });
  }

  try {
    await connectDB();
    const campaign = await Campaign.findOne({ _id: id, deletedAt: null })
      .populate("owner", "name email bio walletAddress")
      .lean();

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: String(campaign._id),
      title: campaign.title,
      description: campaign.description,
      story: campaign.story,
      category: campaign.category,
      contractAddress: campaign.contractAddress,
      imageCid: campaign.imageCid,
      goalWei: campaign.goalWei,
      receivedWei: campaign.receivedWei,
      deadline: campaign.deadline,
      status: campaign.status,
      owner: campaign.owner,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
    });
  } catch (err) {
    console.error("Get campaign error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid campaign id" }, { status: 400 });
  }

  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const parsed = updateCampaignSchema.safeParse(body);
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    Object.assign(campaign, parsed.data);
    await campaign.save();

    return NextResponse.json({
      id: String(campaign._id),
      title: campaign.title,
      description: campaign.description,
      story: campaign.story,
      imageCid: campaign.imageCid,
      updatedAt: campaign.updatedAt,
    });
  } catch (err) {
    console.error("Update campaign error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid campaign id" }, { status: 400 });
  }

  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    await connectDB();
    const campaign = await Campaign.findOne({ _id: id, deletedAt: null });
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const isOwner = String(campaign.owner) === auth.user.sub;
    const isAdmin = auth.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Block deletion if the campaign has received donations.
    const donationCount = await Donation.countDocuments({ campaign: id });
    if (donationCount > 0 && !isAdmin) {
      return NextResponse.json(
        { error: "Campaigns with donations cannot be deleted" },
        { status: 409 }
      );
    }

    campaign.deletedAt = new Date();
    await campaign.save();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete campaign error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
