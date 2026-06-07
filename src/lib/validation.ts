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
