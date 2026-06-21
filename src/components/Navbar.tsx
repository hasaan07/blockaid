"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { WalletButton } from "@/components/WalletButton";

export function Navbar() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <header className="flex flex-wrap items-center justify-between bg-ink px-6 py-4 sm:px-8">
      <Link href="/">
        <h1 className="text-gradient text-2xl font-bold">BLOCK AID</h1>
      </Link>

      <div className="flex flex-wrap items-center gap-1">
        <nav className="flex flex-wrap items-center">
          <Link href="/" className="ml-4 font-bold text-white hover:underline">
            Home
          </Link>
          <Link href="/campaigns" className="ml-4 font-bold text-white hover:underline">
            Campaigns
          </Link>
          {user && (
            <Link href="/dashboard" className="ml-4 font-bold text-white hover:underline">
              Dashboard
            </Link>
          )}
          {user && (
            <Link href="/profile" className="ml-4 font-bold text-white hover:underline">
              Profile
            </Link>
          )}
          {user?.role === "admin" && (
            <Link href="/admin" className="ml-4 font-bold text-cyan hover:underline">
              Admin
            </Link>
          )}
        </nav>

        <div className="ml-3 hidden sm:block">
          <WalletButton />
        </div>

        <div className="flex items-center">
          {loading ? (
            <div className="ml-3 h-9 w-24 animate-pulse rounded bg-white/10" />
          ) : user ? (
            <button
              onClick={handleLogout}
              className="ml-3 rounded-md bg-loginblue px-4 py-2 text-sm font-bold text-white transition hover:bg-loginblue-dark"
            >
              Log out
            </button>
          ) : (
            <>
              <Link
                href="/login"
                className="ml-3 rounded-md bg-loginblue px-4 py-2 text-sm font-bold text-white transition hover:bg-loginblue-dark"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="ml-2 rounded-md bg-signupgreen px-4 py-2 text-sm font-bold text-white transition hover:bg-signupgreen-dark"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
