/**
 * Campaign model — off-chain metadata for a fundraising campaign.
 *
 * The smart contract is the source of truth for on-chain values (creator,
 * goalAmount, deadline, receivedAmount, withdrawn). This document stores
 * presentation data (title, description, images, category) and a link to
 * the on-chain contract via `contractAddress`.
 *
 * Soft delete: `deletedAt` is set instead of removing the document, so
 * historical references (donations, comments) remain consistent.
 */
import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

export const CAMPAIGN_CATEGORIES = [
  "Education",
  "Health",
  "Community",
  "Environment",
  "Technology",
  "Other",
] as const;
export type CampaignCategory = (typeof CAMPAIGN_CATEGORIES)[number];

const campaignSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [100, "Title must be 100 characters or fewer"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [5000, "Description must be 5000 characters or fewer"],
    },
    story: {
      // Longer narrative content, can include simple text. Stored separately so
      // listing pages can return only `description` (a snippet) for performance.
      type: String,
      default: "",
      maxlength: [20000, "Story too long"],
    },
    category: {
      type: String,
      enum: CAMPAIGN_CATEGORIES,
      required: true,
      index: true,
    },
    goalWei: {
      // Stored as string because JavaScript numbers can't represent uint256.
      // Always represents wei (smallest unit of POL).
      type: String,
      required: true,
    },
    deadline: {
      type: Date,
      required: true,
      index: true,
    },
    contractAddress: {
      type: String,
      required: true,
      unique: true, // one Campaign document per deployed contract
      lowercase: true,
      validate: {
        validator: (v: string) => /^0x[a-fA-F0-9]{40}$/.test(v),
        message: "Invalid contract address",
      },
    },
    imageCid: {
      type: String,
      default: "",
      // IPFS CIDs from Pinata. Empty string is acceptable while the user is in draft.
    },
    receivedWei: {
      // Off-chain mirror of on-chain receivedAmount, updated when donations are recorded.
      // Always strings — large numbers.
      type: String,
      default: "0",
    },
    status: {
      // Derived display status, not authoritative — the contract is.
      type: String,
      enum: ["active", "funded", "expired", "withdrawn", "closed"],
      default: "active",
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound index for the listing page query (status + deletedAt + sort by createdAt).
campaignSchema.index({ deletedAt: 1, status: 1, createdAt: -1 });
// Text index for search by title or description.
campaignSchema.index({ title: "text", description: "text" });

export type CampaignDoc = InferSchemaType<typeof campaignSchema> & { _id: string };

export const Campaign: Model<CampaignDoc> =
  (models.Campaign as Model<CampaignDoc>) || model<CampaignDoc>("Campaign", campaignSchema);
