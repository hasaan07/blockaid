"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { RequireUser } from "@/components/RequireUser";
import { CampaignCard } from "@/components/CampaignCard";
import { weiToPol } from "@/lib/format";
import type { CampaignListItem } from "@/types";

function DashboardContent() {
  const { user } = useAuth();
  const [items, setItems] = useState<CampaignListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    async function load() {
      try {
        const res = await fetch(`/api/campaigns?owner=${user!.id}&limit=50`);
        if (res.ok && active) setItems((await res.json()).items);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [user]);

  // Compute stats from the user's campaigns.
  const totalCampaigns = items.length;
  const activeCount = items.filter((c) => c.status === "active").length;
  const fundedCount = items.filter((c) => c.status === "funded").length;
  const totalRaisedWei = items
    .reduce((sum, c) => sum + BigInt(c.receivedWei || "0"), 0n)
    .toString();

  const stats = [
    { label: "My Campaigns", value: String(totalCampaigns) },
    { label: "Total Raised", value: `${weiToPol(totalRaisedWei)} POL` },
    { label: "Active", value: String(activeCount) },
    { label: "Funded", value: String(fundedCount) },
  ];

  return (
    <section className="px-6 py-10 sm:px-12">
      <h2 className="text-gradient mb-2 text-3xl font-bold">Dashboard Overview</h2>
      <p className="mb-6 text-muted">
        Welcome, {user?.name.split(" ")[0]}. Manage your campaigns and track donations here.
      </p>

      <div className="mb-8 flex flex-wrap gap-3.5">
        <Link
          href="/campaigns/new"
          className="rounded-full bg-gradient-to-br from-purple-deep to-cyan px-7 py-3 font-semibold text-white shadow-glow-primary transition hover:scale-105"
        >
          Add New Campaign
        </Link>
        <Link
          href="/campaigns"
          className="rounded-full border border-cyan px-7 py-3 font-semibold text-cyan transition hover:bg-cyan hover:text-ink"
        >
          Browse Campaigns
        </Link>
      </div>

      {/* Stat cards */}
      <div className="flex flex-wrap gap-6">
        {stats.map((s) => (
          <div key={s.label} className="glass flex-1 p-7" style={{ flexBasis: "220px" }}>
            <h3 className="text-sm font-semibold text-muted">{s.label}</h3>
            <p className="mt-2 text-2xl font-bold text-cyan">{s.value}</p>
          </div>
        ))}
      </div>

      {/* My campaigns */}
      <h2 className="text-gradient mb-4 mt-12 text-2xl font-bold">My Campaigns</h2>
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass h-72 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="glass p-12 text-center">
          <p className="text-lg text-body">You haven&apos;t created any campaigns yet.</p>
          <p className="mt-2 text-sm text-muted">
            Campaign creation with wallet deployment is enabled in the next build step.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <CampaignCard key={c.id} campaign={c} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function DashboardPage() {
  return (
    <RequireUser>
      <DashboardContent />
    </RequireUser>
  );
}
