"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseEther } from "ethers";
import { useAuth } from "@/components/AuthProvider";
import { useWallet } from "@/components/WalletProvider";
import { RequireUser } from "@/components/RequireUser";
import { WalletButton } from "@/components/WalletButton";
import { Field, TextareaField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { TxStatus } from "@/components/TxStatus";
import { useTxStatus } from "@/hooks/useTxStatus";
import { createCampaignOnChain } from "@/lib/web3";

const CATEGORIES = ["Education", "Health", "Community", "Environment", "Technology", "Other"];

function CreateCampaignForm() {
  const router = useRouter();
  const { account, isCorrectNetwork, getSigner } = useWallet();
  const tx = useTxStatus();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [story, setStory] = useState("");
  const [goal, setGoal] = useState("");
  const [deadline, setDeadline] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  function validate(): string | null {
    if (title.trim().length < 5) return "Title must be at least 5 characters.";
    if (!category) return "Please choose a category.";
    if (description.trim().length < 10) return "Description must be at least 10 characters.";
    if (!goal || Number(goal) <= 0) return "Goal must be greater than 0.";
    if (!deadline) return "Please choose a deadline.";
    if (new Date(deadline).getTime() <= Date.now()) return "Deadline must be in the future.";
    if (!account) return "Connect your wallet to deploy the campaign.";
    if (!isCorrectNetwork) return "Switch your wallet to Polygon Amoy.";
    return null;
  }

  async function uploadImage(): Promise<string> {
    if (!imageFile) return "";
    const form = new FormData();
    form.append("file", imageFile);
    const res = await fetch("/api/upload", {
      method: "POST",
      credentials: "include",
      body: form,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Image upload failed");
    }
    const data = await res.json();
    return data.cid as string;
  }

  async function handleSubmit() {
    setFormError("");
    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }

    setBusy(true);
    try {
      // 1. Upload image to IPFS (optional).
      let imageCid = "";
      if (imageFile) {
        imageCid = await uploadImage();
      }

      // 2. Deploy the campaign contract via the factory.
      tx.setAwaiting();
      const signer = await getSigner();
      const goalWei = parseEther(goal); // POL → wei (bigint)
      const deadlineUnix = Math.floor(new Date(deadline).getTime() / 1000);

      const { tx: txResponse, address } = await createCampaignOnChain(
        signer,
        title.trim(),
        goalWei,
        deadlineUnix
      );
      tx.setPending(txResponse.hash);

      // createCampaignOnChain already awaited the receipt internally,
      // so by here the contract is deployed. Mark confirmed.
      tx.setConfirmed(txResponse.hash);

      // 3. Save off-chain metadata to our DB.
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          story: story.trim(),
          category,
          goalWei: goalWei.toString(),
          deadline: new Date(deadline).toISOString(),
          contractAddress: address,
          imageCid,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Campaign deployed on-chain but failed to save metadata.");
      }
      const created = await res.json();

      // Success → go to the new campaign's details page.
      router.push(`/campaigns/${created.id}`);
    } catch (e) {
      tx.setError(e);
      setFormError(e instanceof Error ? e.message : "Failed to create campaign.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-2xl px-5 py-12">
      <div className="glass p-8">
        <h2 className="text-gradient mb-2 text-3xl font-bold">Add New Campaign</h2>
        <p className="mb-6 text-sm text-muted">
          Create a campaign with a goal and deadline. This deploys an escrow smart contract on
          Polygon Amoy — you&apos;ll confirm the deployment in your wallet.
        </p>

        {/* Wallet status reminder */}
        {(!account || !isCorrectNetwork) && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan/25 bg-cyan/5 p-4">
            <p className="text-sm text-muted">
              {!account
                ? "Connect your wallet to deploy the campaign contract."
                : "Switch to Polygon Amoy to continue."}
            </p>
            <WalletButton />
          </div>
        )}

        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Campaign Title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Books for Rural Schools"
            />
            <div className="flex flex-col">
              <label htmlFor="category" className="mb-2 text-sm text-[#cbd5f5]">
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-[rgba(2,6,23,0.35)] px-4 py-3 text-body outline-none focus:border-cyan/75 focus:ring-4 focus:ring-cyan/15"
              >
                <option value="" disabled className="bg-ink">
                  Select category
                </option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-ink">
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Field
            label="Short Description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Help us buy 500 books for under-resourced schools."
          />

          <TextareaField
            label="Detailed Story (optional)"
            name="story"
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder="Explain the campaign's purpose and who will benefit…"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Goal (POL)"
              name="goal"
              type="number"
              min="0.01"
              step="0.01"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="5"
            />
            <Field
              label="Deadline"
              name="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="image" className="mb-2 text-sm text-[#cbd5f5]">
              Campaign Image (optional)
            </label>
            <input
              id="image"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              className="text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-cyan/15 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-cyan hover:file:bg-cyan/25"
            />
            {imageFile && (
              <p className="mt-1 text-xs text-muted">
                {imageFile.name} ({(imageFile.size / 1024).toFixed(0)} KB)
              </p>
            )}
          </div>

          {formError && (
            <div className="rounded-2xl bg-[rgba(248,113,113,0.12)] px-4 py-3 text-sm text-danger">
              {formError}
            </div>
          )}

          <TxStatus phase={tx.phase} hash={tx.hash} error={tx.error} />

          <Button
            onClick={handleSubmit}
            loading={busy}
            disabled={!account || !isCorrectNetwork}
            className="mt-2"
          >
            {busy ? "Deploying…" : "Create Campaign"}
          </Button>

          <p className="text-xs text-muted">
            Deploying requires a small amount of test POL for gas. Get some from the{" "}
            <a
              href="https://faucet.polygon.technology"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan hover:underline"
            >
              Polygon Amoy faucet
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}

export default function CreateCampaignPage() {
  return (
    <RequireUser>
      <CreateCampaignForm />
    </RequireUser>
  );
}
