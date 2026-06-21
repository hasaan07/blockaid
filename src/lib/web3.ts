/**
 * Contract interaction helpers (ethers v6).
 *
 * Reads use a JsonRpcProvider (no wallet needed).
 * Writes use the wallet signer (MetaMask) passed in from components.
 */
import {
  JsonRpcProvider,
  Contract,
  type JsonRpcSigner,
  type ContractTransactionResponse,
} from "ethers";
import { CAMPAIGN_FACTORY_ABI, CAMPAIGN_ABI } from "@/lib/abis";
import { FACTORY_ADDRESS, AMOY_RPC } from "@/lib/contracts";

/** Read-only provider for fetching on-chain state without a wallet. */
export function getReadProvider(): JsonRpcProvider {
  return new JsonRpcProvider(AMOY_RPC);
}

/** Read-only factory contract. */
export function getFactoryReadContract(): Contract {
  return new Contract(FACTORY_ADDRESS, CAMPAIGN_FACTORY_ABI, getReadProvider());
}

/** Read-only campaign contract at a given address. */
export function getCampaignReadContract(address: string): Contract {
  return new Contract(address, CAMPAIGN_ABI, getReadProvider());
}

/** Writable factory contract (requires signer). */
export function getFactoryWriteContract(signer: JsonRpcSigner): Contract {
  return new Contract(FACTORY_ADDRESS, CAMPAIGN_FACTORY_ABI, signer);
}

/** Writable campaign contract (requires signer). */
export function getCampaignWriteContract(address: string, signer: JsonRpcSigner): Contract {
  return new Contract(address, CAMPAIGN_ABI, signer);
}

/**
 * Live on-chain summary of a campaign contract.
 * The contract is the source of truth — use this on the details page to show
 * the real received amount and status, not just the DB mirror.
 */
export interface OnChainSummary {
  creator: string;
  title: string;
  goalAmount: bigint;
  deadline: bigint;
  receivedAmount: bigint;
  withdrawn: boolean;
  contributorCount: bigint;
  status: string;
}

export async function fetchOnChainSummary(address: string): Promise<OnChainSummary> {
  const c = getCampaignReadContract(address);
  const [summary, status] = await Promise.all([c.summary(), c.status()]);
  return {
    creator: summary[0],
    title: summary[1],
    goalAmount: summary[2],
    deadline: summary[3],
    receivedAmount: summary[4],
    withdrawn: summary[5],
    contributorCount: summary[6],
    status,
  };
}

/** How much a specific wallet has contributed (for refund eligibility). */
export async function fetchContribution(campaignAddress: string, wallet: string): Promise<bigint> {
  const c = getCampaignReadContract(campaignAddress);
  return c.contributions(wallet);
}

// ----- Write operations (return the tx response so the UI can await + link it) -----

export async function createCampaignOnChain(
  signer: JsonRpcSigner,
  title: string,
  goalWei: bigint,
  deadlineUnix: number
): Promise<{ tx: ContractTransactionResponse; address: string }> {
  const factory = getFactoryWriteContract(signer);
  const tx = await factory.createCampaign(title, goalWei, deadlineUnix);
  const receipt = await tx.wait();

  // Parse the CampaignCreated event to get the new contract address.
  let address = "";
  for (const log of receipt.logs) {
    try {
      const parsed = factory.interface.parseLog(log);
      if (parsed?.name === "CampaignCreated") {
        address = parsed.args.campaignAddress;
        break;
      }
    } catch {
      // not our event; skip
    }
  }
  if (!address) throw new Error("Could not determine new campaign address from event");
  return { tx, address };
}

export async function donateOnChain(
  signer: JsonRpcSigner,
  campaignAddress: string,
  amountWei: bigint
): Promise<ContractTransactionResponse> {
  const c = getCampaignWriteContract(campaignAddress, signer);
  return c.donate({ value: amountWei });
}

export async function withdrawOnChain(
  signer: JsonRpcSigner,
  campaignAddress: string
): Promise<ContractTransactionResponse> {
  const c = getCampaignWriteContract(campaignAddress, signer);
  return c.withdraw();
}

export async function refundOnChain(
  signer: JsonRpcSigner,
  campaignAddress: string
): Promise<ContractTransactionResponse> {
  const c = getCampaignWriteContract(campaignAddress, signer);
  return c.refund();
}
