"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { RequireUser } from "@/components/RequireUser";
import { Field, TextareaField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

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
    <div className="mx-auto max-w-xl px-5 py-12">
      <h1 className="font-display text-3xl font-semibold text-ink">Your profile</h1>
      <p className="mt-2 text-ink-soft">
        Your email is <span className="font-medium text-ink">{user?.email}</span>
        {user?.role === "admin" && (
          <span className="ml-2 rounded bg-gold/15 px-2 py-0.5 text-xs font-semibold text-gold">
            Admin
          </span>
        )}
      </p>

      <div className="mt-8 flex flex-col gap-4">
        <Field
          label="Full name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextareaField
          label="Bio"
          name="bio"
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="A short line about you or your cause."
        />
        <Field
          label="Wallet address (optional)"
          name="walletAddress"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          placeholder="0x…"
        />

        {error && (
          <div className="rounded-md bg-danger-light px-3 py-2 text-sm text-danger">{error}</div>
        )}
        {success && (
          <div className="rounded-md bg-verdigris-light px-3 py-2 text-sm text-verdigris-dark">
            {success}
          </div>
        )}

        <Button onClick={handleSave} loading={loading} className="mt-2 self-start">
          Save changes
        </Button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <RequireUser>
      <ProfileForm />
    </RequireUser>
  );
}
