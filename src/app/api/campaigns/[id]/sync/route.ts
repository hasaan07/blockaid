/**
 * POST /api/campaigns/[id]/sync
 *
 * Reads the campaign contract's live state and updates the off-chain
 * status + receivedWei mirror. Called after withdraw/refund so listings
 * and dashboards stay accurate. Anyone can call it (it only ever makes the
 * DB match the chain — no privileged mutation).
 */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Campaign } from "@/models/Campaign";
import { JsonRpcProvider, Contract } from "ethers";
import { CAMPAIGN_ABI } from "@/lib/abis";
import { AMOY_RPC } from "@/lib/contracts";

interface Params {
  params: Promise<{ id: string }>;
}

function isValidObjectId(id: string) {
  return /^[a-f0-9]{24}$/.test(id);
}

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid campaign id" }, { status: 400 });
  }

  try {
    await connectDB();
    const campaign = await Campaign.findOne({ _id: id, deletedAt: null });
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const provider = new JsonRpcProvider(AMOY_RPC);
    const contract = new Contract(campaign.contractAddress, CAMPAIGN_ABI, provider);

    const [received, withdrawn, statusStr] = await Promise.all([
      contract.receivedAmount(),
      contract.withdrawn(),
      contract.status(),
    ]);

    campaign.receivedWei = received.toString();

    // Map the contract's status string to our enum.
    type CampaignStatus = "active" | "funded" | "expired" | "withdrawn" | "closed";
    const map: Record<string, CampaignStatus> = {
      Active: "active",
      Funded: "funded",
      Expired: "expired",
      Withdrawn: "withdrawn",
      Closed: "closed",
    };
    const mapped = map[statusStr];
    if (mapped) campaign.status = mapped;
    if (withdrawn) campaign.status = "withdrawn";

    await campaign.save();

    return NextResponse.json({
      status: campaign.status,
      receivedWei: campaign.receivedWei,
    });
  } catch (err) {
    // A fake/seeded contract address (used in tests) or an unreachable RPC will
    // throw BAD_DATA / decode errors. That's expected — just report it quietly.
    const code = (err as { code?: string })?.code;
    if (code === "BAD_DATA" || code === "CALL_EXCEPTION") {
      return NextResponse.json(
        { error: "No on-chain data for this contract (sync skipped)" },
        { status: 200 }
      );
    }
    console.error("Sync error:", err);
    return NextResponse.json({ error: "Failed to sync with chain" }, { status: 500 });
  }
}
