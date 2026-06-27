"use client";

import { useState, useEffect, useCallback } from "react";
import { weiToPol, shortAddress, formatDate } from "@/lib/format";
import { explorerTx } from "@/lib/contracts";

interface AdminDonation {
  id: string;
  campaign: { title?: string; contractAddress?: string } | string;
  backerWallet: string;
  amountWei: string;
  txHash: string;
  createdAt: string;
}

export default function AdminDonations() {
  const [items, setItems] = useState<AdminDonation[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/donations?page=${page}&limit=20`, {
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

  function campaignTitle(c: AdminDonation["campaign"]): string {
    if (!c) return "—";
    return typeof c === "string" ? "—" : c.title || "—";
  }

  return (
    <div className="glass overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-muted">
            <tr>
              <th className="px-5 py-3 font-semibold">Campaign</th>
              <th className="px-5 py-3 font-semibold">Backer</th>
              <th className="px-5 py-3 font-semibold">Amount</th>
              <th className="px-5 py-3 font-semibold">Date</th>
              <th className="px-5 py-3 font-semibold">Tx</th>
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
                  No donations found.
                </td>
              </tr>
            ) : (
              items.map((d) => (
                <tr key={d.id} className="border-b border-white/5">
                  <td className="px-5 py-3 text-body">{campaignTitle(d.campaign)}</td>
                  <td className="px-5 py-3 text-muted">{shortAddress(d.backerWallet)}</td>
                  <td className="px-5 py-3 text-body">{weiToPol(d.amountWei)} POL</td>
                  <td className="px-5 py-3 text-muted">{formatDate(d.createdAt)}</td>
                  <td className="px-5 py-3">
                    <a
                      href={explorerTx(d.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan hover:underline"
                    >
                      {shortAddress(d.txHash)}
                    </a>
                  </td>
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
