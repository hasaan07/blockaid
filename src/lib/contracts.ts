/**
 * On-chain configuration for BlockAid.
 *
 * The factory address and RPC come from env. CHAIN_ID is Polygon Amoy.
 * These NEXT_PUBLIC_ vars are safe to expose to the browser.
 */

export const AMOY_CHAIN_ID = 80002;
export const AMOY_CHAIN_ID_HEX = "0x13882"; // 80002 in hex, used by wallet_switchEthereumChain

export const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS || "";
export const AMOY_RPC = process.env.NEXT_PUBLIC_AMOY_RPC || "https://rpc-amoy.polygon.technology";
export const PINATA_GATEWAY =
  process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud";

/** Network params used when asking MetaMask to add Amoy if the user doesn't have it. */
export const AMOY_NETWORK_PARAMS = {
  chainId: AMOY_CHAIN_ID_HEX,
  chainName: "Polygon Amoy Testnet",
  nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
  rpcUrls: [AMOY_RPC],
  blockExplorerUrls: ["https://amoy.polygonscan.com"],
};

export const EXPLORER_BASE = "https://amoy.polygonscan.com";

export function explorerTx(hash: string): string {
  return `${EXPLORER_BASE}/tx/${hash}`;
}

export function explorerAddress(addr: string): string {
  return `${EXPLORER_BASE}/address/${addr}`;
}
