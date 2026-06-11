"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { RequireUser } from "@/components/RequireUser";

function DashboardContent() {
  const { user } = useAuth();
  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <h1 className="font-display text-3xl font-semibold text-ink">
        Welcome, {user?.name.split(" ")[0]}
      </h1>
      <p className="mt-2 text-ink-soft">
        This is your dashboard. Campaign management lands here in the next build.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/campaigns/new"
          className="rounded-lg border border-paper-edge bg-white p-6 transition hover:border-verdigris"
        >
          <h2 className="font-display text-xl font-semibold text-ink">Start a campaign</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Deploy an escrow contract and begin raising funds.
          </p>
        </Link>
        <Link
          href="/campaigns"
          className="rounded-lg border border-paper-edge bg-white p-6 transition hover:border-verdigris"
        >
          <h2 className="font-display text-xl font-semibold text-ink">Browse campaigns</h2>
          <p className="mt-1 text-sm text-ink-soft">Find a cause worth backing.</p>
        </Link>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <RequireUser>
      <DashboardContent />
    </RequireUser>
  );
}
