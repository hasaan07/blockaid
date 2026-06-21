"use client";

import { useState } from "react";
import { parseEther, formatEther } from "ethers";
import { useAuth } from "@/components/AuthProvider";
import { useWallet } from "@/components/WalletProvider";
import { WalletButton } from "@/components/WalletButton";
import { Button } from "@/components/ui/Button";
import { TxStatus } from "@/components/TxStatus";
import { useTxStatus } from "@/hooks/useTxStatus";
import { donateOnChain } from "@/lib/web3";

interface DonatePanelProps {
  campaignId: string;
  contractAddress: string;
  ended: boolean;
  withdrawn: boolean;
  onDonated: () => void; // called after a successful donation so the page can refresh
}

export function DonatePanel({
  campaignId,
  contractAddress,
  ended,
  withdrawn,
  onDonated,
}: DonatePanelProps) {
  const { user } = useAuth();
  const { account, isCorrectNetwork, getSigner } = useWallet();
  const tx = useTxStatus();

  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const disabledReason = ended
    ? "This campaign has ended."
    : withdrawn
      ? "Funds have already been withdrawn."
      : null;

  async function handleDonate() {
    setError("");

    const value = Number(amount);
    if (!amount || Number.isNaN(value) || value <= 0) {
      setError("Enter a donation amount greater than 0.");
      return;
    }
    if (!account) {
      setError("Connect your wallet to donate.");
      return;
    }
    if (!isCorrectNetwork) {
      setError("Switch your wallet to Polygon Amoy.");
      return;
    }

    setBusy(true);
    try {
      const amountWei = parseEther(amount);

      // 1. Send the donation transaction to the escrow contract.
      tx.setAwaiting();
      const signer = await getSigner();
      const txResponse = await donateOnChain(signer, contractAddress, amountWei);
      tx.setPending(txResponse.hash);

      // 2. Wait for on-chain confirmation.
      const receipt = await txResponse.wait();
      tx.setConfirmed(txResponse.hash);

      // 3. Record the donation in our DB (proof = tx hash).
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          campaignId,
          backerWallet: account,
          amountWei: amountWei.toString(),
          txHash: txResponse.hash,
          blockNumber: receipt?.blockNumber ?? 0,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // The on-chain donation succeeded even if recording failed — make that clear.
        throw new Error(
          data.error ||
            "Donation confirmed on-chain, but failed to record. Your funds are safe in the contract."
        );
      }

      setAmount("");
      onDonated(); // refresh campaign + donations on the parent page
    } catch (e) {
      tx.setError(e);
      const msg = e instanceof Error ? e.message : "Donation failed.";
      // Don't double-show wallet-rejection (TxStatus already shows it).
      if (!msg.toLowerCase().includes("cancelled")) setError(msg);
    } finally {
      setBusy(false);
    }
  }

  // Campaign ended or withdrawn — no donations possible.
  if (disabledReason) {
    return (
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h4 className="font-semibold text-body">Support this campaign</h4>
        <p className="mt-1 text-sm text-muted">{disabledReason}</p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-cyan/25 bg-cyan/5 p-5">
      <h4 className="font-semibold text-body">Support this campaign</h4>
      <p className="mt-1 text-sm text-muted">
        Your donation is held in escrow and released to the creator only when the goal is met. If
        the goal isn&apos;t reached by the deadline, you can claim a refund.
      </p>

      {!user && (
        <p className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-muted">
          Tip: log in to link this donation to your account. You can still donate with just a wallet
          connected.
        </p>
      )}

      {!account || !isCorrectNetwork ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-muted">
            {!account ? "Connect your wallet to donate." : "Switch to Polygon Amoy."}
          </span>
          <WalletButton />
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-1 flex-col">
            <label htmlFor="donate-amount" className="mb-1.5 text-sm text-[#cbd5f5]">
              Amount (POL)
            </label>
            <input
              id="donate-amount"
              type="number"
              min="0"
              step="0.001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.1"
              className="w-full rounded-2xl border border-white/15 bg-[rgba(2,6,23,0.35)] px-4 py-3 text-body outline-none placeholder:text-white/40 focus:border-cyan/75 focus:ring-4 focus:ring-cyan/15"
            />
          </div>
          <Button onClick={handleDonate} loading={busy}>
            {busy ? "Processing…" : "Donate"}
          </Button>
        </div>
      )}

      {/* Quick amount chips */}
      {account && isCorrectNetwork && (
        <div className="mt-3 flex flex-wrap gap-2">
          {["0.05", "0.1", "0.5", "1"].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setAmount(v)}
              className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-muted transition hover:border-cyan hover:text-cyan"
            >
              {v} POL
            </button>
          ))}
        </div>
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
