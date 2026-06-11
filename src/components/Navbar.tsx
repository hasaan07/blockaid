"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export function Navbar() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-paper-edge bg-paper/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-semibold text-ink">BlockAid</span>
          <span className="hidden text-xs uppercase tracking-widest text-verdigris sm:inline">
            Ledger of Giving
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/campaigns"
            className="rounded px-3 py-2 text-sm font-medium text-ink-soft transition hover:text-ink"
          >
            Browse
          </Link>

          {loading ? (
            <div className="h-9 w-20 animate-pulse rounded bg-paper-edge" />
          ) : user ? (
            <>
              <Link
                href="/campaigns/new"
                className="rounded px-3 py-2 text-sm font-medium text-ink-soft transition hover:text-ink"
              >
                Start a campaign
              </Link>
              <Link
                href="/dashboard"
                className="rounded px-3 py-2 text-sm font-medium text-ink-soft transition hover:text-ink"
              >
                Dashboard
              </Link>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="rounded px-3 py-2 text-sm font-medium text-gold transition hover:opacity-80"
                >
                  Admin
                </Link>
              )}
              <div className="mx-1 hidden h-5 w-px bg-paper-edge sm:block" />
              <Link
                href="/profile"
                className="rounded px-3 py-2 text-sm font-medium text-ink transition hover:text-verdigris"
              >
                {user.name.split(" ")[0]}
              </Link>
              <button
                onClick={handleLogout}
                className="rounded px-3 py-2 text-sm font-medium text-ink-soft transition hover:text-danger"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded px-3 py-2 text-sm font-medium text-ink transition hover:text-verdigris"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-verdigris px-4 py-2 text-sm font-semibold text-paper transition hover:bg-verdigris-dark"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
