"use client";

import { useWallet } from "@/components/WalletProvider";
import { shortAddress } from "@/lib/format";

export function WalletButton() {
  const { account, isCorrectNetwork, hasMetaMask, connecting, connect, switchToAmoy } = useWallet();

  if (!hasMetaMask) {
    return (
      <a
        href="https://metamask.io/download"
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full border border-cyan px-5 py-2.5 text-sm font-semibold text-cyan transition hover:bg-cyan hover:text-ink"
      >
        Install MetaMask
      </a>
    );
  }

  if (!account) {
    return (
      <button
        onClick={connect}
        disabled={connecting}
        className="rounded-full bg-gradient-to-br from-purple-deep to-cyan px-5 py-2.5 text-sm font-semibold text-white shadow-glow-primary transition hover:scale-105 disabled:opacity-50"
      >
        {connecting ? "Connecting…" : "Connect Wallet"}
      </button>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <button
        onClick={switchToAmoy}
        className="rounded-full border border-danger px-5 py-2.5 text-sm font-semibold text-danger transition hover:bg-danger hover:text-white"
      >
        Switch to Polygon Amoy
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-cyan/35 bg-cyan/10 px-4 py-2 text-sm font-semibold text-cyan">
      <span className="h-2 w-2 rounded-full bg-cyan" />
      {shortAddress(account)}
    </span>
  );
}
