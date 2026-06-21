"use client";

/**
 * WalletProvider — MetaMask connection + network state via ethers v6.
 *
 * Responsibilities:
 *   - Detect window.ethereum (MetaMask).
 *   - Connect/disconnect the wallet, track the active account.
 *   - Detect whether the wallet is on Polygon Amoy; offer to switch/add it.
 *   - Expose a BrowserProvider + Signer for write transactions.
 *
 * We never store private keys. All signing happens inside MetaMask.
 */
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { BrowserProvider, type Eip1193Provider } from "ethers";
import { AMOY_CHAIN_ID, AMOY_CHAIN_ID_HEX, AMOY_NETWORK_PARAMS } from "@/lib/contracts";

declare global {
  interface Window {
    ethereum?: Eip1193Provider & {
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

interface WalletContextValue {
  account: string | null;
  chainId: number | null;
  isCorrectNetwork: boolean;
  hasMetaMask: boolean;
  connecting: boolean;
  connect: () => Promise<void>;
  switchToAmoy: () => Promise<void>;
  getSigner: () => Promise<import("ethers").JsonRpcSigner>;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Detect MetaMask and existing connection on mount.
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) {
      setHasMetaMask(false);
      return;
    }
    setHasMetaMask(true);

    const eth = window.ethereum;

    // Check if already connected (without prompting).
    (async () => {
      try {
        const accounts = (await eth.request({ method: "eth_accounts" })) as string[];
        if (accounts.length > 0) setAccount(accounts[0]);
        const cid = (await eth.request({ method: "eth_chainId" })) as string;
        setChainId(parseInt(cid, 16));
      } catch {
        // ignore
      }
    })();

    // React to account/network changes.
    const handleAccounts = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      setAccount(accounts.length > 0 ? accounts[0] : null);
    };
    const handleChain = (...args: unknown[]) => {
      const cid = args[0] as string;
      setChainId(parseInt(cid, 16));
    };

    eth.on?.("accountsChanged", handleAccounts);
    eth.on?.("chainChanged", handleChain);

    return () => {
      eth.removeListener?.("accountsChanged", handleAccounts);
      eth.removeListener?.("chainChanged", handleChain);
    };
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      window.open("https://metamask.io/download", "_blank");
      return;
    }
    setConnecting(true);
    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      setAccount(accounts[0] ?? null);
      const cid = (await window.ethereum.request({ method: "eth_chainId" })) as string;
      setChainId(parseInt(cid, 16));
    } finally {
      setConnecting(false);
    }
  }, []);

  const switchToAmoy = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: AMOY_CHAIN_ID_HEX }],
      });
    } catch (err: unknown) {
      // 4902 = chain not added yet. Add it, then it becomes selected.
      if (err && typeof err === "object" && "code" in err && err.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [AMOY_NETWORK_PARAMS],
        });
      } else {
        throw err;
      }
    }
  }, []);

  const getSigner = useCallback(async () => {
    if (!window.ethereum) throw new Error("MetaMask not found");
    const provider = new BrowserProvider(window.ethereum);
    return provider.getSigner();
  }, []);

  return (
    <WalletContext.Provider
      value={{
        account,
        chainId,
        isCorrectNetwork: chainId === AMOY_CHAIN_ID,
        hasMetaMask,
        connecting,
        connect,
        switchToAmoy,
        getSigner,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within a WalletProvider");
  return ctx;
}
