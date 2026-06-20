"use client";

import { useState, useEffect, useCallback } from "react";
import { CampaignCard } from "@/components/CampaignCard";
import type { CampaignListItem } from "@/types";

const CATEGORIES = ["Education", "Health", "Community", "Environment", "Technology", "Other"];
const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "ending_soon", label: "Ending Soon" },
  { value: "most_funded", label: "Most Funded" },
];

export default function CampaignsPage() {
  const [items, setItems] = useState<CampaignListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  // Debounce the search box so we don't fire a request on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  // Any filter change resets to page 1.
  useEffect(() => {
    setPage(1);
  }, [category, sort, debouncedQ]);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "12");
      params.set("sort", sort);
      if (category) params.set("category", category);
      if (debouncedQ) params.set("q", debouncedQ);

      const res = await fetch(`/api/campaigns?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load campaigns");
      const data = await res.json();
      setItems(data.items);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, [page, sort, category, debouncedQ]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return (
    <section className="px-6 py-10 sm:px-12">
      <h2 className="text-gradient mb-2 text-3xl font-bold">Active Fundraising Campaigns</h2>
      <p className="mb-8 text-muted">
        All campaigns are managed via blockchain smart contracts for secure, transparent donations.
      </p>

      {/* Controls */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search campaigns…"
          className="w-full rounded-full border border-white/15 bg-[rgba(2,6,23,0.35)] px-5 py-3 text-body outline-none placeholder:text-white/40 focus:border-cyan/75 focus:ring-4 focus:ring-cyan/15 lg:max-w-sm"
        />

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCategory("")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              category === ""
                ? "bg-cyan text-ink"
                : "border border-white/15 text-muted hover:text-body"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                category === c
                  ? "bg-cyan text-ink"
                  : "border border-white/15 text-muted hover:text-body"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-full border border-white/15 bg-[rgba(2,6,23,0.35)] px-4 py-2.5 text-sm text-body outline-none focus:border-cyan/75"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value} className="bg-ink">
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass h-72 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="glass p-8 text-center text-danger">{error}</div>
      ) : items.length === 0 ? (
        <div className="glass p-12 text-center">
          <p className="text-lg text-body">No campaigns match your search.</p>
          <p className="mt-2 text-sm text-muted">Try a different category or clear your filters.</p>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted">
            {total} campaign{total === 1 ? "" : "s"} found
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-body transition hover:border-cyan disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="text-sm text-muted">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-body transition hover:border-cyan disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
