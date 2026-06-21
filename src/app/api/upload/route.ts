/**
 * POST /api/upload
 *
 * Accepts a multipart form with a single "file" field (an image).
 * Pins it to IPFS via Pinata using the server-side JWT (never exposed to client).
 * Returns { cid } — the IPFS content identifier to store on the campaign.
 *
 * Auth required: only logged-in users can upload.
 */
import { NextResponse } from "next/server";
import { requireAuth } from "@/middleware/requireAuth";

const PINATA_JWT = process.env.PINATA_JWT;
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  if (!PINATA_JWT) {
    return NextResponse.json({ error: "Upload service not configured" }, { status: 500 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PNG, JPEG, WebP, or GIF images are allowed" },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Image must be 5 MB or smaller" }, { status: 400 });
    }

    // Forward to Pinata.
    const pinataForm = new FormData();
    pinataForm.append("file", file, file.name);

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: { Authorization: `Bearer ${PINATA_JWT}` },
      body: pinataForm,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("Pinata error:", res.status, text);
      return NextResponse.json({ error: "Failed to upload to IPFS" }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({ cid: data.IpfsHash });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
