/**
 * POST /api/auth/logout
 *
 * Clears the auth cookie. Safe to call even when not authenticated.
 */
import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";

export async function POST() {
  await clearAuthCookie();
  return NextResponse.json({ ok: true });
}
