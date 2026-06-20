/** Shared client-side types. */

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  bio?: string;
  walletAddress?: string;
}

export interface CampaignOwner {
  _id?: string;
  name: string;
  email: string;
  bio?: string;
  walletAddress?: string;
}

export interface CampaignListItem {
  id: string;
  title: string;
  description: string;
  category: string;
  contractAddress: string;
  imageCid: string;
  goalWei: string;
  receivedWei: string;
  deadline: string;
  status: string;
  owner: CampaignOwner | string;
  createdAt: string;
}

export interface CampaignDetail extends CampaignListItem {
  story: string;
  updatedAt: string;
}

export interface DonationItem {
  id: string;
  campaignId: string;
  backerWallet: string;
  amountWei: string;
  txHash: string;
  blockNumber: number;
  createdAt: string;
}

export interface FeedItem {
  id: string;
  body: string;
  author: CampaignOwner | string;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
