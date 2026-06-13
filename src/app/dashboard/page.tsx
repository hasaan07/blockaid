"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { RequireUser } from "@/components/RequireUser";

function DashboardContent() {
  const { user } = useAuth();

  return (
    <section className="px-6 py-10 sm:px-16">
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

      <div className="flex flex-wrap gap-6">
        {[
          { label: "Total Campaigns", value: "—" },
          { label: "Total Donations", value: "—" },
          { label: "Active Campaigns", value: "—" },
          { label: "Total Donors", value: "—" },
        ].map((s) => (
          <div key={s.label} className="glass flex-1 p-7" style={{ flexBasis: "240px" }}>
            <h3 className="text-lg font-semibold text-white">{s.label}</h3>
            <p className="mt-2 text-2xl font-bold text-cyan">{s.value}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-sm text-muted">
        Live campaign data and donation history will appear here once campaign browsing is wired up.
      </p>
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
