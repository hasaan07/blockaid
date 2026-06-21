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

/**
 * Polygon Amoy enforces a minimum gas tip (~25 gwei) that MetaMask often
 * underestimates, causing "gas price below minimum" rejections. We fetch the
 * network's current fee data and floor the priority fee at 30 gwei to stay
 * safely above the minimum.
 */
async function getAmoyFeeOverrides(signer: JsonRpcSigner) {
  const provider = signer.provider;
  const feeData = await provider.getFeeData();

  const MIN_PRIORITY = 30_000_000_000n; // 30 gwei, comfortably above Amoy's 25 gwei floor

  const priority =
    feeData.maxPriorityFeePerGas && feeData.maxPriorityFeePerGas > MIN_PRIORITY
      ? feeData.maxPriorityFeePerGas
      : MIN_PRIORITY;

  // maxFee = base fee (approx) + priority. Use network maxFeePerGas if it's higher.
  const base = feeData.maxFeePerGas ?? MIN_PRIORITY * 2n;
  const maxFee = base > priority ? base : priority * 2n;

  return {
    maxPriorityFeePerGas: priority,
    maxFeePerGas: maxFee,
  };
}

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
  const fees = await getAmoyFeeOverrides(signer);
  const tx = await factory.createCampaign(title, goalWei, deadlineUnix, fees);
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
  const fees = await getAmoyFeeOverrides(signer);
  return c.donate({ value: amountWei, ...fees });
}

export async function withdrawOnChain(
  signer: JsonRpcSigner,
  campaignAddress: string
): Promise<ContractTransactionResponse> {
  const c = getCampaignWriteContract(campaignAddress, signer);
  const fees = await getAmoyFeeOverrides(signer);
  return c.withdraw(fees);
}

export async function refundOnChain(
  signer: JsonRpcSigner,
  campaignAddress: string
): Promise<ContractTransactionResponse> {
  const c = getCampaignWriteContract(campaignAddress, signer);
  const fees = await getAmoyFeeOverrides(signer);
  return c.refund(fees);
}
