/**
 * /api/donations
 *   POST — record a confirmed on-chain donation (auth OPTIONAL)
 *   GET  — list donations (filters: campaignId, backerWallet)
 *
 * POST is intentionally open to unauthenticated callers — the frontend may
 * record a donation even if the donor is not logged in to BlockAid (they could
 * still have a wallet connected). What matters is the tx hash, which is the
 * cryptographic proof. If the caller IS logged in, we link the donation to
 * their account.
 *
 * The integrity guarantee is the txHash uniqueness constraint at the DB level:
 * the same tx can never be recorded twice.
 */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Donation } from "@/models/Donation";
import { Campaign } from "@/models/Campaign";
import { getCurrentUserPayload } from "@/lib/auth";
import { createDonationSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createDonationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }
    const { campaignId, backerWallet, amountWei, txHash, blockNumber } = parsed.data;

    await connectDB();

    const campaign = await Campaign.findOne({ _id: campaignId, deletedAt: null });
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Optionally link the donation to the authenticated user.
    const auth = await getCurrentUserPayload();

    const donation = await Donation.create({
      campaign: campaignId,
      backerWallet,
      backerUser: auth ? auth.sub : null,
      amountWei,
      txHash,
      blockNumber,
    });

    // Update the off-chain mirror of receivedWei. This is approximate (the chain
    // is the source of truth) but lets the listing page sort by receivedWei without
    // hitting the chain for every campaign.
    const newReceived = BigInt(campaign.receivedWei) + BigInt(amountWei);
    campaign.receivedWei = newReceived.toString();
    if (newReceived >= BigInt(campaign.goalWei)) {
      campaign.status = "funded";
    }
    await campaign.save();

    return NextResponse.json(
      {
        id: String(donation._id),
        campaignId,
        txHash,
        amountWei,
        newReceivedWei: campaign.receivedWei,
        status: campaign.status,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === 11000) {
      return NextResponse.json(
        { error: "This transaction has already been recorded" },
        { status: 409 }
      );
    }
    console.error("Create donation error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const campaignId = url.searchParams.get("campaignId") || undefined;
    const backerWallet = url.searchParams.get("backerWallet")?.toLowerCase() || undefined;
    const limit = Math.min(Number(url.searchParams.get("limit") || "20"), 100);

    const filter: Record<string, unknown> = {};
    if (campaignId) filter.campaign = campaignId;
    if (backerWallet) filter.backerWallet = backerWallet;

    await connectDB();
    const items = await Donation.find(filter).sort({ createdAt: -1 }).limit(limit).lean();

    return NextResponse.json({
      items: items.map((d) => ({
        id: String(d._id),
        campaignId: String(d.campaign),
        backerWallet: d.backerWallet,
        amountWei: d.amountWei,
        txHash: d.txHash,
        blockNumber: d.blockNumber,
        createdAt: d.createdAt,
      })),
      count: items.length,
    });
  } catch (err) {
    console.error("List donations error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
