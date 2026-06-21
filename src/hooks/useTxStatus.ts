"use client";

import { useState, useCallback } from "react";

export type TxPhase = "idle" | "awaiting" | "pending" | "confirmed" | "error";

interface TxState {
  phase: TxPhase;
  hash: string | null;
  error: string | null;
}

/**
 * Tracks the lifecycle of a single on-chain transaction so the UI can show
 * clear status: awaiting wallet confirmation → pending on-chain → confirmed.
 *
 * Maps common wallet/contract errors to human-readable messages.
 */
export function useTxStatus() {
  const [state, setState] = useState<TxState>({ phase: "idle", hash: null, error: null });

  const reset = useCallback(() => {
    setState({ phase: "idle", hash: null, error: null });
  }, []);

  const setAwaiting = useCallback(() => {
    setState({ phase: "awaiting", hash: null, error: null });
  }, []);

  const setPending = useCallback((hash: string) => {
    setState({ phase: "pending", hash, error: null });
  }, []);

  const setConfirmed = useCallback((hash: string) => {
    setState({ phase: "confirmed", hash, error: null });
  }, []);

  const setError = useCallback((err: unknown) => {
    setState({ phase: "error", hash: null, error: humanizeError(err) });
  }, []);

  return { ...state, reset, setAwaiting, setPending, setConfirmed, setError };
}

/** Translate wallet/contract errors into plain language. */
export function humanizeError(err: unknown): string {
  if (!err) return "Something went wrong.";

  const e = err as {
    code?: number | string;
    reason?: string;
    message?: string;
    shortMessage?: string;
  };

  // User rejected in MetaMask.
  if (e.code === 4001 || e.code === "ACTION_REJECTED") {
    return "Transaction cancelled in your wallet.";
  }
  // Insufficient funds.
  if (typeof e.message === "string" && e.message.toLowerCase().includes("insufficient funds")) {
    return "Insufficient POL for this transaction (including gas).";
  }
  // Contract revert reason (ethers v6 surfaces this on .reason or .shortMessage).
  if (e.reason) return e.reason;
  if (e.shortMessage) return e.shortMessage;
  if (typeof e.message === "string" && e.message.length < 160) return e.message;

  return "Transaction failed. Please try again.";
}
