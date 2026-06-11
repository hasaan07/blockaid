"use client";

/**
 * Client-side route guard. Redirects to /login if not authenticated.
 * Wrap protected page content in this component.
 *
 * Note: this is UX-level protection only. The real security is server-side
 * in the API routes (requireAuth). This just avoids showing protected UI
 * to logged-out users.
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export function RequireUser({ children, role }: { children: React.ReactNode; role?: "admin" }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    } else if (!loading && role && user?.role !== role) {
      router.replace("/");
    }
  }, [loading, user, role, router]);

  if (loading) {
    return <div className="mx-auto max-w-md px-5 py-24 text-center text-ink-soft">Loading…</div>;
  }

  if (!user || (role && user.role !== role)) {
    return null; // redirect in flight
  }

  return <>{children}</>;
}
