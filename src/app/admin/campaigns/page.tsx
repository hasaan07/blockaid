"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { weiToPol, shortAddress, formatDate } from "@/lib/format";
import type { CampaignOwner } from "@/types";

interface AdminCampaign {
  id: string;
  title: string;
  category: string;
  contractAddress: string;
  receivedWei: string;
  goalWei: string;
  status: string;
  deletedAt: string | null;
  owner: CampaignOwner | string;
  createdAt: string;
}

export default function AdminCampaigns() {
  const [items, setItems] = useState<AdminCampaign[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/campaigns?page=${page}&limit=20`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
        setTotalPages(data.totalPages || 1);
      }
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="glass overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-muted">
            <tr>
              <th className="px-5 py-3 font-semibold">Title</th>
              <th className="px-5 py-3 font-semibold">Category</th>
              <th className="px-5 py-3 font-semibold">Raised / Goal</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Contract</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-muted">
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-muted">
                  No campaigns found.
                </td>
              </tr>
            ) : (
              items.map((c) => (
                <tr key={c.id} className="border-b border-white/5">
                  <td className="px-5 py-3">
                    <Link href={`/campaigns/${c.id}`} className="text-cyan hover:underline">
                      {c.title}
                    </Link>
                    {c.deletedAt && <span className="ml-2 text-xs text-danger">(deleted)</span>}
                  </td>
                  <td className="px-5 py-3 text-muted">{c.category}</td>
                  <td className="px-5 py-3 text-body">
                    {weiToPol(c.receivedWei)} / {weiToPol(c.goalWei)} POL
                  </td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-semibold text-muted">
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted">{shortAddress(c.contractAddress)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 border-t border-white/10 py-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-full border border-white/15 px-4 py-1.5 text-sm text-body disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-sm text-muted">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-full border border-white/15 px-4 py-1.5 text-sm text-body disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
