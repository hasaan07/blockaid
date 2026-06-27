"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/Button";

interface CommentFormProps {
  campaignId: string;
  onPosted: () => void;
}

export function CommentForm({ campaignId, onPosted }: CommentFormProps) {
  const { user } = useAuth();
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!user) {
    return (
      <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-muted">
        <Link href="/login" className="text-cyan hover:underline">
          Log in
        </Link>{" "}
        to leave a comment.
      </div>
    );
  }

  async function handlePost() {
    setError("");
    if (body.trim().length < 1) {
      setError("Comment cannot be empty.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ body: body.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to post comment");
      }
      setBody("");
      onPosted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to post comment");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-4">
      <textarea
        rows={2}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add a comment…"
        maxLength={500}
        className="w-full rounded-2xl border border-white/15 bg-[rgba(2,6,23,0.35)] px-4 py-3 text-body outline-none placeholder:text-white/40 focus:border-cyan/75 focus:ring-4 focus:ring-cyan/15"
      />
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-muted">{body.length}/500</span>
        <Button onClick={handlePost} loading={busy}>
          {busy ? "Posting…" : "Post Comment"}
        </Button>
      </div>
    </div>
  );
}
