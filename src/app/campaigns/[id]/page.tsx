"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { campaignImage } from "@/lib/campaignImage";
import { weiToPol, percentFunded, shortAddress, formatDate, timeRemaining } from "@/lib/format";
import { Badge } from "@/components/ui/Card";
import type { CampaignDetail, DonationItem, FeedItem, CampaignOwner } from "@/types";
import { DonatePanel } from "@/components/DonatePanel";
import { FundActions } from "@/components/FundActions";
import { useAuth } from "@/components/AuthProvider";
import { UpdateForm } from "@/components/UpdateForm";
import { CommentForm } from "@/components/CommentForm";

function ownerName(o: CampaignOwner | string | undefined): string {
  if (!o) return "Unknown";
  return typeof o === "string" ? "Unknown" : o.name;
}

export default function CampaignDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [donations, setDonations] = useState<DonationItem[]>([]);
  const [updates, setUpdates] = useState<FeedItem[]>([]);
  const [comments, setComments] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { user } = useAuth();

  const loadAll = useCallback(async () => {
    try {
      const res = await fetch(`/api/campaigns/${id}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setCampaign(data);

      // Sync DB status with on-chain state (fire-and-forget; non-blocking).
      fetch(`/api/campaigns/${id}/sync`, { method: "POST" }).catch(() => {});

      const [dRes, uRes, cRes] = await Promise.all([
        fetch(`/api/donations?campaignId=${id}&limit=50`),
        fetch(`/api/campaigns/${id}/updates`),
        fetch(`/api/campaigns/${id}/comments`),
      ]);
      if (dRes.ok) setDonations((await dRes.json()).items);
      if (uRes.ok) setUpdates((await uRes.json()).items);
      if (cRes.ok) setComments((await cRes.json()).items);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleDeleteComment(commentId: string) {
    if (!confirm("Delete this comment? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/comments/${commentId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason: "Removed by admin" }),
      });
      if (res.ok) {
        loadAll(); // refresh comments
      } else {
        alert("Failed to delete comment.");
      }
    } catch {
      alert("Failed to delete comment.");
    }
  }

  if (loading) {
    return <div className="px-6 py-24 text-center text-muted">Loading campaign…</div>;
  }

  if (notFound || !campaign) {
    return (
      <div className="px-6 py-24 text-center">
        <h2 className="text-gradient text-2xl font-bold">Campaign not found</h2>
        <p className="mt-3 text-muted">This campaign may have been removed or never existed.</p>
        <Link
          href="/campaigns"
          className="mt-6 inline-block rounded-full border border-cyan px-6 py-2.5 font-semibold text-cyan transition hover:bg-cyan hover:text-ink"
        >
          Back to Campaigns
        </Link>
      </div>
    );
  }

  const pct = percentFunded(campaign.receivedWei, campaign.goalWei);
  const uniqueBackers = new Set(donations.map((d) => d.backerWallet)).size;
  const ended = new Date(campaign.deadline).getTime() <= Date.now();

  const ownerId = typeof campaign.owner === "string" ? campaign.owner : campaign.owner?._id;
  const isOwner = !!user && !!ownerId && user.id === ownerId;

  return (
    <section className="px-6 py-10 sm:px-12">
      {/* Breadcrumb */}
      <nav className="mb-3 flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/campaigns" className="text-cyan hover:underline">
          Campaigns
        </Link>
        <span className="opacity-70">/</span>
        <span>{campaign.title}</span>
      </nav>

      <h2 className="text-gradient mb-2 text-3xl font-bold">View Campaign Details</h2>
      <p className="mb-6 text-muted">
        Campaign information, funding progress, timeline, donation action, and community updates.
      </p>

      <div className="grid items-start gap-6 lg:grid-cols-[2fr_1fr]">
        {/* MAIN */}
        <div className="glass p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <Image
                src={campaignImage(campaign)}
                alt={campaign.title}
                width={64}
                height={64}
                className="h-16 w-16 object-contain"
                unoptimized={!!campaign.imageCid}
              />
              <div>
                <h3 className="text-2xl font-semibold text-white">{campaign.title}</h3>
                <p className="mt-1 max-w-xl text-sm text-muted">{campaign.description}</p>
                <p className="mt-1 text-xs text-muted">by {ownerName(campaign.owner)}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>{ended ? "Ended" : "Active"}</Badge>
              <Badge ghost>{campaign.category}</Badge>
            </div>
          </div>

          {/* Stat tiles */}
          <div className="mt-6 grid grid-cols-2 gap-3.5">
            {[
              { label: "Goal", value: `${weiToPol(campaign.goalWei)} POL` },
              { label: "Raised", value: `${weiToPol(campaign.receivedWei)} POL` },
              { label: "Backers", value: String(uniqueBackers) },
              { label: "Contract", value: shortAddress(campaign.contractAddress) },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/10 bg-[rgba(2,6,23,0.25)] px-4 py-3.5"
              >
                <p className="text-xs text-white/65">{s.label}</p>
                <p className="mt-1.5 font-bold text-body">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Progress */}
          <div className="mt-6">
            <h4 className="mb-2 font-semibold text-body">Funding progress</h4>
            <progress value={pct} max={100} />
            <div className="mt-2 flex flex-wrap justify-between gap-3 text-sm text-muted">
              <span>{pct.toFixed(0)}% funded</span>
              <span>
                {weiToPol(campaign.receivedWei)} / {weiToPol(campaign.goalWei)} POL
              </span>
            </div>
          </div>

          {/* Timeline */}
          <div className="mt-6">
            <h4 className="mb-2 font-semibold text-body">Deadline / timeline</h4>
            <ul className="list-disc pl-5 text-sm text-body">
              <li>
                <strong>Created:</strong> {formatDate(campaign.createdAt)}
              </li>
              <li>
                <strong>Deadline:</strong> {formatDate(campaign.deadline)}{" "}
                <span className="text-muted">
                  ({ended ? "ended" : timeRemaining(campaign.deadline)})
                </span>
              </li>
            </ul>
          </div>

          {/* Story */}
          {campaign.story && (
            <div className="mt-6">
              <h4 className="mb-2 font-semibold text-body">About this campaign</h4>
              <p className="whitespace-pre-line text-sm leading-relaxed text-body/90">
                {campaign.story}
              </p>
            </div>
          )}

          <DonatePanel
            campaignId={campaign.id}
            contractAddress={campaign.contractAddress}
            ended={ended}
            withdrawn={campaign.status === "withdrawn"}
            onDonated={loadAll}
          />

          <FundActions contractAddress={campaign.contractAddress} onChanged={loadAll} />
        </div>

        {/* ASIDE */}
        <aside className="flex flex-col gap-6">
          {/* Recent donations */}
          <div className="glass p-6">
            <h4 className="font-semibold text-body">Recent donations</h4>
            {donations.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No donations yet. Be the first to give.</p>
            ) : (
              <ul className="mt-3 grid gap-2.5">
                {donations.slice(0, 6).map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-[rgba(2,6,23,0.25)] px-3 py-2 text-sm"
                  >
                    <span className="text-muted">{shortAddress(d.backerWallet)}</span>
                    <span className="font-semibold text-body">{weiToPol(d.amountWei)} POL</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Updates */}
          {/* Updates */}
          <div className="glass p-6">
            <h4 className="font-semibold text-body">Updates</h4>
            {isOwner && (
              <div className="mt-3">
                <UpdateForm campaignId={campaign.id} onPosted={loadAll} />
              </div>
            )}
            {updates.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No updates posted yet.</p>
            ) : (
              <ul className="mt-3 grid gap-3">
                {updates.map((u) => (
                  <li key={u.id} className="border-l-2 border-cyan/40 pl-3">
                    <p className="text-xs text-muted">
                      {formatDate(u.createdAt)} · {ownerName(u.author)}
                    </p>
                    <p className="mt-1 text-sm text-body">{u.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Comments */}
          <div className="glass p-6">
            <h4 className="font-semibold text-body">Comments</h4>
            <div className="mt-3">
              <CommentForm campaignId={campaign.id} onPosted={loadAll} />
            </div>
            {comments.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No comments yet.</p>
            ) : (
              <ul className="mt-3 grid gap-3">
                {comments.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-xl border border-white/10 bg-[rgba(2,6,23,0.25)] px-3 py-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-muted">
                        <strong className="text-body">{ownerName(c.author)}</strong> ·{" "}
                        {formatDate(c.createdAt)}
                      </p>
                      {user?.role === "admin" && (
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className="text-xs text-danger hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-body">{c.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
