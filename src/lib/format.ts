/**
 * Client-safe formatting helpers.
 *
 * goalWei / receivedWei come from the API as decimal strings in wei
 * (1 POL = 10^18 wei). We use BigInt math to avoid floating-point errors
 * on large numbers, then format for display.
 */

const WEI_PER_POL = 10n ** 18n;

/** Convert a wei string to a human-readable POL string (trims trailing zeros). */
export function weiToPol(wei: string, decimals = 4): string {
  let value: bigint;
  try {
    value = BigInt(wei || "0");
  } catch {
    return "0";
  }
  const whole = value / WEI_PER_POL;
  const frac = value % WEI_PER_POL;
  if (frac === 0n) return whole.toString();

  const fracStr = frac
    .toString()
    .padStart(18, "0")
    .slice(0, decimals)
    .replace(/0+$/, "");
  return fracStr ? `${whole}.${fracStr}` : whole.toString();
}

/** Percentage of goal funded, 0–100, integer-safe. */
export function percentFunded(receivedWei: string, goalWei: string): number {
  try {
    const r = BigInt(receivedWei || "0");
    const g = BigInt(goalWei || "0");
    if (g === 0n) return 0;
    const pct = Number((r * 10000n) / g) / 100;
    return Math.min(100, Math.max(0, pct));
  } catch {
    return 0;
  }
}

/** Format an ISO date or Date as e.g. "20 May 2026". */
export function formatDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
}

/** Human-friendly time until a deadline. */
export function timeRemaining(deadline: string | Date): string {
  const d = typeof deadline === "string" ? new Date(deadline) : deadline;
  const diff = d.getTime() - Date.now();
  if (Number.isNaN(d.getTime())) return "—";
  if (diff <= 0) return "Ended";

  const days = Math.floor(diff / 86_400_000);
  if (days >= 1) return `${days} day${days === 1 ? "" : "s"} left`;
  const hours = Math.floor(diff / 3_600_000);
  if (hours >= 1) return `${hours} hour${hours === 1 ? "" : "s"} left`;
  const mins = Math.floor(diff / 60_000);
  return `${mins} min${mins === 1 ? "" : "s"} left`;
}

/** Shorten a 0x address to 0xABCD...123 form. */
export function shortAddress(addr: string): string {
  if (!addr || addr.length < 12) return addr || "—";
  return `${addr.slice(0, 6)}...${addr.slice(-3)}`;
}
