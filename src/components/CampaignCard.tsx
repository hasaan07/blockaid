import Link from "next/link";
import Image from "next/image";
import { campaignImage } from "@/lib/campaignImage";
import { weiToPol, percentFunded, shortAddress, timeRemaining } from "@/lib/format";
import { Badge } from "@/components/ui/Card";
import type { CampaignListItem } from "@/types";

export function CampaignCard({ campaign }: { campaign: CampaignListItem }) {
  const pct = percentFunded(campaign.receivedWei, campaign.goalWei);
  const ended = new Date(campaign.deadline).getTime() <= Date.now();

  return (
    <div className="glass flex flex-col p-6 text-center transition hover:-translate-y-2.5 hover:shadow-glow-strong">
      <Image
        src={campaignImage(campaign)}
        alt={campaign.title}
        width={72}
        height={72}
        className="mx-auto mb-3 h-[72px] w-[72px] object-contain"
        unoptimized={!!campaign.imageCid}
      />

      <div className="mb-2 flex items-center justify-center gap-2">
        <Badge ghost>{campaign.category}</Badge>
        <Badge>{ended ? "Ended" : timeRemaining(campaign.deadline)}</Badge>
      </div>

      <h3 className="text-lg font-semibold text-white">{campaign.title}</h3>
      <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-muted">{campaign.description}</p>

      <progress className="mt-3" value={pct} max={100} />
      <p className="mt-2 text-sm text-body">
        {weiToPol(campaign.receivedWei)} / {weiToPol(campaign.goalWei)} POL
        <span className="ml-2 text-muted">({pct.toFixed(0)}%)</span>
      </p>
      <p className="mt-1 text-xs text-muted">
        <strong>Contract:</strong> {shortAddress(campaign.contractAddress)}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={`/campaigns/${campaign.id}`}
          className="rounded-full border border-cyan px-4 py-2 text-sm font-semibold text-cyan transition hover:bg-cyan hover:text-ink"
        >
          View Details
        </Link>
        <Link
          href={`/campaigns/${campaign.id}`}
          className="rounded-full bg-gradient-to-br from-purple-deep to-cyan px-4 py-2 text-sm font-semibold text-white shadow-glow-primary transition hover:scale-105"
        >
          Donate
        </Link>
      </div>
    </div>
  );
}
