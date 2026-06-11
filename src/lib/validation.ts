/**
 * Zod schemas for API input validation.
 *
 * Every API route that takes user input should validate against one of these.
 * Schemas are exported alongside their inferred TypeScript types so route
 * handlers can use them as the request body type.
 */
import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80, "Name too long"),
  email: z.string().trim().toLowerCase().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long"),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  bio: z.string().max(500).optional(),
  walletAddress: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^(0x[a-fA-F0-9]{40})?$/, "Invalid wallet address format")
    .optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ----- Campaign schemas -----
import { CAMPAIGN_CATEGORIES } from "@/models/Campaign";

export const createCampaignSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().trim().min(10, "Description too short").max(5000),
  story: z.string().max(20000).optional().default(""),
  category: z.enum(CAMPAIGN_CATEGORIES),
  goalWei: z.string().regex(/^[1-9]\d*$/, "Goal must be a positive integer (wei)"),
  deadline: z.string().refine((s) => !Number.isNaN(Date.parse(s)) && Date.parse(s) > Date.now(), {
    message: "Deadline must be a valid future date",
  }),
  contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid contract address"),
  imageCid: z.string().max(200).optional().default(""),
});
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;

export const updateCampaignSchema = z.object({
  description: z.string().trim().min(10).max(5000).optional(),
  story: z.string().max(20000).optional(),
  imageCid: z.string().max(200).optional(),
});
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;

export const listCampaignsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  category: z.enum(CAMPAIGN_CATEGORIES).optional(),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(["newest", "ending_soon", "most_funded"]).default("newest"),
  status: z.enum(["active", "funded", "expired", "withdrawn", "closed"]).optional(),
  owner: z.string().optional(), // userId filter for "My Campaigns"
});
export type ListCampaignsQuery = z.infer<typeof listCampaignsQuerySchema>;

// ----- Donation schemas -----
export const createDonationSchema = z.object({
  campaignId: z.string().regex(/^[a-f0-9]{24}$/, "Invalid campaign id"),
  backerWallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
  amountWei: z.string().regex(/^[1-9]\d*$/, "Amount must be a positive integer (wei)"),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash"),
  blockNumber: z.coerce.number().int().min(0).optional().default(0),
});
export type CreateDonationInput = z.infer<typeof createDonationSchema>;

// ----- Update schemas -----
export const createUpdateSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});
export type CreateUpdateInput = z.infer<typeof createUpdateSchema>;

// ----- Comment schemas -----
export const createCommentSchema = z.object({
  body: z.string().trim().min(1).max(500),
});
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

// ----- Admin schemas -----
export const adminActionSchema = z.object({
  reason: z.string().max(500).optional().default(""),
});
export type AdminActionInput = z.infer<typeof adminActionSchema>;
