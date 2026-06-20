/**
 * Maps a campaign to a display image.
 * - If the campaign has an uploaded IPFS image (imageCid), use the Pinata gateway.
 * - Otherwise fall back to a category icon from /public/images.
 *
 * (The large photo assets blockchain.png / donation.png are intentionally
 * NOT used as card icons — they're multi-MB and would slow the grid.)
 */
const CATEGORY_ICON: Record<string, string> = {
  Education: "education",
  Health: "medical",
  Community: "orphan",
  Environment: "water",
  Technology: "smart-contract",
  Other: "global",
};

export function categoryIcon(category: string): string {
  return `/images/${CATEGORY_ICON[category] ?? "global"}.png`;
}

export function campaignImage(campaign: { imageCid?: string; category: string }): string {
  if (campaign.imageCid) {
    const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud";
    return `${gateway}/ipfs/${campaign.imageCid}`;
  }
  return categoryIcon(campaign.category);
}
