/**
 * Helper to gate API routes that require authentication.
 *
 * Usage in a route handler:
 *
 *   const auth = await requireAuth();
 *   if (auth instanceof NextResponse) return auth;  // 401 returned to client
 *   // From here on, `auth.user` is guaranteed.
 *
 * For admin-only routes:
 *   const auth = await requireAuth({ role: "admin" });
 *   if (auth instanceof NextResponse) return auth;
 */
import { NextResponse } from "next/server";
import { getCurrentUserPayload, type JwtPayload } from "@/lib/auth";

interface RequireAuthOptions {
  role?: "user" | "admin";
}

interface AuthSuccess {
  user: JwtPayload;
}

export async function requireAuth(
  opts: RequireAuthOptions = {}
): Promise<AuthSuccess | NextResponse> {
  const payload = await getCurrentUserPayload();

  if (!payload) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (opts.role && payload.role !== opts.role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { user: payload };
}
