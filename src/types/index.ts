/** Shared client-side types. */

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  bio?: string;
  walletAddress?: string;
}
