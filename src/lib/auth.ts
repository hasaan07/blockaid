/**
 * Authentication utilities.
 *
 * JWT strategy:
 *   - HS256 signing with JWT_SECRET (server-side only, never exposed to client).
 *   - Payload: { sub: userId, role, email }
 *   - Stored in an HttpOnly, Secure (in prod), SameSite=Lax cookie named "blockaid_token".
 *   - Expires after JWT_EXPIRES_IN (default 7 days).
 *
 * Why HttpOnly cookie instead of localStorage?
 *   HttpOnly means JavaScript can't read it, which protects against XSS-based token theft.
 *   It's automatically attached to every request to our domain, no client-side code needed.
 */
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || "12");
const COOKIE_NAME = "blockaid_token";

if (!JWT_SECRET) {
  // We import this file from route handlers; failing at import time is fine because
  // the API will be broken anyway without the secret.
  // (Tests should mock this or set the env.)
  console.warn("JWT_SECRET is not set. Auth will not work until it is configured.");
}

// ----- Types -----
export interface JwtPayload {
  sub: string; // user _id
  email: string;
  role: "user" | "admin";
}

// ----- Password hashing -----
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ----- JWT -----
export function signToken(payload: JwtPayload): string {
  if (!JWT_SECRET) throw new Error("JWT_SECRET is not set");
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload | null {
  if (!JWT_SECRET) throw new Error("JWT_SECRET is not set");
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

// ----- Cookie helpers (called from route handlers) -----

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function readAuthCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

// ----- Get current authenticated user (for protected routes) -----

export async function getCurrentUserPayload(): Promise<JwtPayload | null> {
  const token = await readAuthCookie();
  if (!token) return null;
  return verifyToken(token);
}
