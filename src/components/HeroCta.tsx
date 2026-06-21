"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useWallet } from "@/components/WalletProvider";
import { shortAddress } from "@/lib/format";

export function HeroCta() {
  const { user, loading } = useAuth();
  const { account, isCorrectNetwork, connect, switchToAmoy, connecting } = useWallet();
  const router = useRouter();

  async function handleSmartAction() {
    if (!user) {
      // Not logged in → send to sign up.
      router.push("/register");
      return;
    }
    // Logged in → handle wallet.
    if (!account) {
      await connect();
    } else if (!isCorrectNetwork) {
      await switchToAmoy();
    }
    // If already connected + correct network, the label shows the address (no-op).
  }

  // Decide the secondary button's label/state.
  let smartLabel = "Connect Wallet";
  if (loading) smartLabel = "Loading…";
  else if (!user) smartLabel = "Get Started";
  else if (connecting) smartLabel = "Connecting…";
  else if (!account) smartLabel = "Connect Wallet";
  else if (!isCorrectNetwork) smartLabel = "Switch to Amoy";
  else smartLabel = `Connected: ${shortAddress(account)}`;

  const isConnected = !!user && !!account && isCorrectNetwork;

  return (
    <div className="mt-8 flex flex-wrap justify-center gap-4">
      <Link
        href="/campaigns"
        className="rounded-full bg-gradient-to-br from-purple-deep to-cyan px-8 py-3.5 font-semibold text-white shadow-glow-primary transition hover:scale-105"
      >
        Explore Campaigns
      </Link>

      <button
        onClick={handleSmartAction}
        disabled={loading || connecting || isConnected}
        className="rounded-full border border-cyan px-8 py-3.5 font-semibold text-cyan transition hover:bg-cyan hover:text-ink disabled:cursor-default disabled:opacity-80 disabled:hover:bg-transparent disabled:hover:text-cyan"
      >
        {smartLabel}
      </button>
    </div>
  );
}
