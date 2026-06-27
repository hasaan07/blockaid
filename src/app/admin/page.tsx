"use client";

import { useState, useEffect } from "react";
import { weiToPol } from "@/lib/format";

export default function AdminOverview() {
  const [stats, setStats] = useState({
    users: 0,
    campaigns: 0,
    donations: 0,
    totalRaisedWei: "0",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [uRes, cRes, dRes] = await Promise.all([
          fetch("/api/admin/users?limit=1", { credentials: "include" }),
          fetch("/api/admin/campaigns?limit=1", { credentials: "include" }),
          fetch("/api/admin/donations?limit=100", { credentials: "include" }),
        ]);
        if (!active) return;

        const u = uRes.ok ? await uRes.json() : { total: 0 };
        const c = cRes.ok ? await cRes.json() : { total: 0 };
        const d = dRes.ok ? await dRes.json() : { total: 0, items: [] };

        const totalRaised = (d.items || [])
          .reduce(
            (sum: bigint, item: { amountWei: string }) => sum + BigInt(item.amountWei || "0"),
            0n
          )
          .toString();

        setStats({
          users: u.total || 0,
          campaigns: c.total || 0,
          donations: d.total || 0,
          totalRaisedWei: totalRaised,
        });
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const cards = [
    { label: "Total Users", value: loading ? "…" : String(stats.users) },
    { label: "Total Campaigns", value: loading ? "…" : String(stats.campaigns) },
    { label: "Total Donations", value: loading ? "…" : String(stats.donations) },
    {
      label: "Raised (recent)",
      value: loading ? "…" : `${weiToPol(stats.totalRaisedWei)} POL`,
    },
  ];

  return (
    <div className="flex flex-wrap gap-6">
      {cards.map((c) => (
        <div key={c.label} className="glass flex-1 p-7" style={{ flexBasis: "220px" }}>
          <h3 className="text-sm font-semibold text-muted">{c.label}</h3>
          <p className="mt-2 text-2xl font-bold text-cyan">{c.value}</p>
        </div>
      ))}
      <p className="mt-2 w-full text-xs text-muted">
        Note: &quot;Raised (recent)&quot; sums the latest 100 donations. Full analytics are future
        work (see documentation).
      </p>
    </div>
  );
}
