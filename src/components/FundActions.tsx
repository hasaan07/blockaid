"use client";

import { useState, useEffect, useCallback } from "react";
import { formatEther } from "ethers";
import { useWallet } from "@/components/WalletProvider";
import { Button } from "@/components/ui/Button";
import { TxStatus } from "@/components/TxStatus";
import { useTxStatus } from "@/hooks/useTxStatus";
import {
  fetchOnChainSummary,
  fetchContribution,
  withdrawOnChain,
  refundOnChain,
  type OnChainSummary,
} from "@/lib/web3";

interface FundActionsProps {
  contractAddress: string;
  onChanged: () => void; // refresh parent after withdraw/refund
}

export function FundActions({ contractAddress, onChanged }: FundActionsProps) {
  const { account, isCorrectNetwork, getSigner } = useWallet();
  const tx = useTxStatus();

  const [summary, setSummary] = useState<OnChainSummary | null>(null);
  const [myContribution, setMyContribution] = useState<bigint>(0n);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadOnChain = useCallback(async () => {
    try {
      const s = await fetchOnChainSummary(contractAddress);
      setSummary(s);
      if (account) {
        const contrib = await fetchContribution(contractAddress, account);
        setMyContribution(contrib);
      } else {
        setMyContribution(0n);
      }
    } catch {
      // contract read failed — likely a seeded fake address; just hide actions
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [contractAddress, account]);

  useEffect(() => {
    loadOnChain();
  }, [loadOnChain]);

  if (loading || !summary) return null;

  const now = Math.floor(Date.now() / 1000);
  const deadlinePassed = now >= Number(summary.deadline);
  const goalMet = summary.receivedAmount >= summary.goalAmount;
  const isCreator = account?.toLowerCase() === summary.creator.toLowerCase();

  // Eligibility per the contract rules (mirrors Campaign.sol).
  const canWithdraw = isCreator && goalMet && !summary.withdrawn;
  const canRefund =
    !!account && deadlinePassed && !goalMet && !summary.withdrawn && myContribution > 0n;

  // Nothing actionable for this viewer.
  if (!canWithdraw && !canRefund) {
    // Still surface a helpful status line for the creator/backer.
    let note: string | null = null;
    if (isCreator && summary.withdrawn) note = "You have withdrawn the funds for this campaign.";
    else if (isCreator && !goalMet && !deadlinePassed)
      note = "You can withdraw once the funding goal is reached.";
    else if (isCreator && !goalMet && deadlinePassed)
      note = "Goal was not met by the deadline — backers can claim refunds.";
    else if (myContribution > 0n && goalMet)
      note = "Goal met — funds will go to the creator. Refunds are not available.";
    else if (myContribution > 0n && !deadlinePassed)
      note = "Refunds become available after the deadline if the goal isn't met.";

    if (!note) return null;
    return (
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-muted">
        {note}
      </div>
    );
  }

  async function handleWithdraw() {
    setError("");
    if (!isCorrectNetwork) return setError("Switch your wallet to Polygon Amoy.");
    setBusy(true);
    try {
      tx.setAwaiting();
      const signer = await getSigner();
      const txResponse = await withdrawOnChain(signer, contractAddress);
      tx.setPending(txResponse.hash);
      await txResponse.wait();
      tx.setConfirmed(txResponse.hash);
      await loadOnChain();
      onChanged();
    } catch (e) {
      tx.setError(e);
      const msg = e instanceof Error ? e.message : "Withdraw failed.";
      if (!msg.toLowerCase().includes("cancelled")) setError(msg);
    } finally {
      setBusy(false);
    }
  }

  async function handleRefund() {
    setError("");
    if (!isCorrectNetwork) return setError("Switch your wallet to Polygon Amoy.");
    setBusy(true);
    try {
      tx.setAwaiting();
      const signer = await getSigner();
      const txResponse = await refundOnChain(signer, contractAddress);
      tx.setPending(txResponse.hash);
      await txResponse.wait();
      tx.setConfirmed(txResponse.hash);
      await loadOnChain();
      onChanged();
    } catch (e) {
      tx.setError(e);
      const msg = e instanceof Error ? e.message : "Refund failed.";
      if (!msg.toLowerCase().includes("cancelled")) setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-gold/30 bg-gold/5 mt-6 rounded-2xl border p-5">
      {canWithdraw && (
        <>
          <h4 className="font-semibold text-body">Withdraw funds</h4>
          <p className="mt-1 text-sm text-muted">
            Your campaign reached its goal of {formatEther(summary.goalAmount)} POL. Withdraw the
            escrowed {formatEther(summary.receivedAmount)} POL to your wallet.
          </p>
          <Button onClick={handleWithdraw} loading={busy} className="mt-4">
            {busy ? "Processing…" : `Withdraw ${formatEther(summary.receivedAmount)} POL`}
          </Button>
        </>
      )}

      {canRefund && (
        <>
          <h4 className="font-semibold text-body">Claim your refund</h4>
          <p className="mt-1 text-sm text-muted">
            This campaign didn&apos;t reach its goal by the deadline. You can claim back your
            contribution of {formatEther(myContribution)} POL.
          </p>
          <Button onClick={handleRefund} loading={busy} className="mt-4">
            {busy ? "Processing…" : `Claim ${formatEther(myContribution)} POL refund`}
          </Button>
        </>
      )}

      {error && (
        <div className="mt-3 rounded-2xl bg-[rgba(248,113,113,0.12)] px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <TxStatus phase={tx.phase} hash={tx.hash} error={tx.error} />
    </div>
  );
}
