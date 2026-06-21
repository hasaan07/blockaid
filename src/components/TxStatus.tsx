"use client";

import { explorerTx } from "@/lib/contracts";
import type { TxPhase } from "@/hooks/useTxStatus";

interface TxStatusProps {
  phase: TxPhase;
  hash: string | null;
  error: string | null;
}

export function TxStatus({ phase, hash, error }: TxStatusProps) {
  if (phase === "idle") return null;

  const config: Record<Exclude<TxPhase, "idle">, { text: string; cls: string }> = {
    awaiting: {
      text: "Confirm the transaction in your wallet…",
      cls: "border-cyan/35 bg-cyan/10 text-cyan",
    },
    pending: {
      text: "Transaction submitted. Waiting for confirmation…",
      cls: "border-purple/35 bg-purple/10 text-purple",
    },
    confirmed: {
      text: "Transaction confirmed on-chain.",
      cls: "border-cyan/35 bg-cyan/10 text-cyan",
    },
    error: {
      text: error || "Transaction failed.",
      cls: "border-danger/40 bg-[rgba(248,113,113,0.12)] text-danger",
    },
  };

  const c = config[phase];

  return (
    <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${c.cls}`}>
      <div className="flex items-center gap-2">
        {(phase === "awaiting" || phase === "pending") && (
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        <span>{c.text}</span>
      </div>
      {hash && (
        <a
          href={explorerTx(hash)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block text-xs underline opacity-80 hover:opacity-100"
        >
          View on Polygonscan →
        </a>
      )}
    </div>
  );
}
