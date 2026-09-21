// The pool page's on-chain binding (milestone riprap-9ehc). The ONE static
// pool constant on this page is the per-cluster mutual address map — every
// number below it renders from mutual.tiers after fetch. Copy source:
// meta/marketing/03-website-copy/landing-page.md § "On-chain states + juror
// modal" — "renders nothing it wasn't told", no static fallback numbers on
// any state; {{fee}}/{{tier}} ← mutual.tiers (reference: policy §5).

import type { Mutual } from "@riprap/hanse";
import type { Address } from "@solana/kit";

/**
 * Resolve the mutual address for the active cluster. localnet reads
 * VITE_LOCALNET_MUTUAL lazily (inside the function) so dev and tests can
 * point at a Surfpool surfnet without a rebuild.
 */
export function resolveMutualAddress(clusters: {
  isLocal: boolean;
  isMainnet: boolean;
  isDevnet: boolean;
}): Address | undefined {
  if (clusters.isLocal) {
    const local = import.meta.env.VITE_LOCALNET_MUTUAL as string | undefined;
    return local ? (local as Address) : undefined;
  }
  if (clusters.isMainnet) {
    const mainnet = import.meta.env.VITE_MAINNET_MUTUAL as string | undefined;
    return mainnet ? (mainnet as Address) : undefined;
  }
  if (clusters.isDevnet) {
    const devnet = import.meta.env.VITE_DEVNET_MUTUAL as string | undefined;
    return devnet ? (devnet as Address) : undefined;
  }
  return undefined;
}

/**
 * Tier names are page copy (policy §5 order, copy doc "Basic · Standard ·
 * Premium"); prices and caps always come from the chain, by index.
 */
export const TIER_NAMES = ["Basic", "Standard", "Premium"] as const;

/** A renderable tier: copy name + on-chain prices in whole dollars. */
export interface PoolTier {
  name: string;
  fee: number;
  cap: number;
}

/** Raw u64 in 6-dp USDC (fixtures: $10 = 10_000_000n) → dollars. */
export function microToUsd(raw: bigint): number {
  return Number(raw) / 1_000_000;
}

/** mutual.tiers → renderable tiers (names by §5 index, prices from chain). */
export function poolTiers(mutual: Mutual): PoolTier[] {
  return mutual.tiers.map((t, i) => ({
    name: TIER_NAMES[i] ?? `Tier ${i + 1}`,
    fee: microToUsd(t.contribution),
    cap: microToUsd(t.maxPayout),
  }));
}

/** deposits_close_at (unix seconds) → deterministic UTC mono stamp. */
export function formatUtc(seconds: bigint): string {
  const d = new Date(Number(seconds) * 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`;
}

/** The deposits window: open until deposits_close_at (chain truth, §2.7). */
export function depositsOpenAt(closeAtSeconds: bigint, nowSeconds = Date.now() / 1000): boolean {
  return nowSeconds < Number(closeAtSeconds);
}
