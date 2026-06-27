"use client";

import { useState } from "react";
import { TextareaField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

interface UpdateFormProps {
  campaignId: string;
  onPosted: () => void; // refresh parent after a successful post
}

export function UpdateForm({ campaignId, onPosted }: UpdateFormProps) {
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handlePost() {
    setError("");
    if (body.trim().length < 1) {
      setError("Update cannot be empty.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ body: body.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to post update");
      }
      setBody("");
      onPosted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to post update");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-4 rounded-2xl border border-white/10 bg-[rgba(2,6,23,0.25)] p-4">
      <TextareaField
        label="Post an update"
        name="update-body"
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share progress with your backers…"
      />
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      <div className="mt-3 flex justify-end">
        <Button onClick={handlePost} loading={busy}>
          {busy ? "Posting…" : "Publish Update"}
        </Button>
      </div>
    </div>
  );
}
