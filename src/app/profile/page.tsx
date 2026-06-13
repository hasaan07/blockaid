"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { RequireUser } from "@/components/RequireUser";
import { Field, TextareaField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function ProfileForm() {
  const { user, refresh } = useAuth();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setBio(user.bio || "");
      setWalletAddress(user.walletAddress || "");
    }
  }, [user]);

  async function handleSave() {
    setError("");
    setSuccess("");
    if (name.trim().length < 1) return setError("Name is required.");
    if (walletAddress && !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return setError("Wallet address must be a 0x-prefixed 40-character hex string.");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim(), bio, walletAddress }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Update failed");
      }
      await refresh();
      setSuccess("Profile saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex min-h-[calc(100vh-200px)] items-center justify-center px-5 py-12">
      <div className="glass w-full max-w-xl p-8">
        <h2 className="text-gradient mb-3 text-3xl font-bold">Edit Profile</h2>
        <p className="mb-6 text-sm text-muted">Update your profile details below.</p>

        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/10 font-bold text-[#cbd5f5]">
            {user ? initials(user.name) : "··"}
          </div>
          <div>
            <p className="font-semibold text-body">{user?.name}</p>
            <p className="text-sm text-muted">
              Role: {user?.role === "admin" ? "Administrator" : "Donor / Creator"}
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          <Field
            label="Full Name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Field
            label="Email Address"
            name="email"
            type="email"
            value={user?.email || ""}
            disabled
            className="opacity-60"
          />
          <TextareaField
            label="Bio"
            name="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A short line about you or your cause."
          />
          <Field
            label="Wallet Address (optional)"
            name="walletAddress"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="0x..."
          />

          {error && (
            <div className="rounded-2xl bg-[rgba(248,113,113,0.12)] px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-2xl bg-cyan/10 px-4 py-3 text-sm text-cyan">{success}</div>
          )}

          <Button onClick={handleSave} loading={loading} className="mt-2 self-start">
            Save Changes
          </Button>
        </div>
      </div>
    </section>
  );
}

export default function ProfilePage() {
  return (
    <RequireUser>
      <ProfileForm />
    </RequireUser>
  );
}
