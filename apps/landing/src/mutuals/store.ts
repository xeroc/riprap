// The mutuals store — on-chain discovery + resolution to directory listings.
// One getProgramAccounts scan (the SDK's fetchAllMutuals) finds every Mutual
// on the active cluster; each hit's address resolves against the pubkeys
// pinned in data.ts. Pubkeys are not reused across clusters in practice, so
// one registry serves devnet and mainnet — whatever matches here is live
// here. On-chain mutuals with no listing resolve through their anchored
// riprap-def/v1 doc (epic riprap-hs4r, D4): seed + policyHash off the
// account → the derived domain_ref → the evidence daemon's CAS → a valid
// def ⇒ a derived listing in the community band below the founder
// directory; 404, a hash mismatch, or a doc that isn't a def drops the pool
// (a state, never fallback content). Listings with nothing on-chain stay
// drafts and never reach the store's output. That is the enable mechanism:
// a pool appears exactly when it exists on-chain.
import { fetchAllMutuals, type Mutual, type ScannedAccount } from "@riprap/hanse";
import { useCluster } from "@solana/connector";
import type { Address } from "@solana/kit";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { domainRefHex, sha256Hex, toHex } from "../pool/domainRef";
import { useEvidenceDaemonUrl } from "../pool/evidenceServer";
import { useClusterRpc } from "../shared/rpc";
import { MUTUALS } from "./data";
import { listingFromDef } from "./def/listing";
import { parseDefDoc, type RiprapDef } from "./def/schema";
import type { MutualListing } from "./types";

/** A directory listing that is live on the active cluster: the listing, the
 *  on-chain address it resolved to, its decoded Mutual account, and — for
 *  community pools only — the anchored def the listing was derived from. */
export interface LiveMutual {
  listing: MutualListing;
  address: Address;
  account: Mutual;
  def?: RiprapDef;
}

/**
 * The registry the scan resolves against: address → listing. Pinned pubkeys
 * are cluster-agnostic (pubkeys are not reused across clusters in practice);
 * the cluster flags only feed the Blade Pool's env-driven address while its
 * key is unpinned (pool/mutual.ts — the same fallback useMemberCount uses).
 */
export function knownMutuals(listings: MutualListing[] = MUTUALS): Map<Address, MutualListing> {
  const known = new Map<Address, MutualListing>();
  for (const listing of listings) {
    const address = listing?.pubkey;
    if (address !== undefined) known.set(address as Address, listing);
  }
  return known;
}

/** Directory rank — the founder display order (data.ts); community pools
 *  sort after every founder. */
const RANK = new Map<MutualListing, number>(MUTUALS.map((m, i) => [m, i] as const));

/**
 * Resolve scan hits against the registry: each hit keeps its listing and
 * decoded account; hits without a listing wait on their def resolution
 * (`defs` — address → the validated doc, absent = dropped). The output keeps
 * the directory's founder display order, community pools after.
 */
export function resolveLiveMutuals(
  scanned: ScannedAccount<Mutual>[],
  known: Map<Address, MutualListing>,
  defs: ReadonlyMap<Address, RiprapDef> = new Map(),
): LiveMutual[] {
  const live: LiveMutual[] = [];
  for (const hit of scanned) {
    const listing = known.get(hit.address);
    if (listing !== undefined) {
      live.push({ listing, address: hit.address, account: hit.data });
      continue;
    }
    const def = defs.get(hit.address);
    if (def !== undefined) {
      // milestone open question: community ordering assumes creation slot —
      // the scan carries none, so the address is the deterministic stand-in
      live.push({
        listing: listingFromDef(def, hit.address),
        address: hit.address,
        account: hit.data,
        def,
      });
    }
  }
  return live.sort((a, b) => {
    const rank = (x: LiveMutual) =>
      x.def === undefined ? (RANK.get(x.listing) ?? MUTUALS.length) : MUTUALS.length + 1;
    return rank(a) - rank(b) || a.address.localeCompare(b.address);
  });
}

/** The store's shape: render `state` first, then `pools`. */
export type MutualStore =
  | { state: "off" } // no active cluster — nothing to scan
  | { state: "loading" }
  | { state: "error"; error: unknown; retry: () => void } // scan failed (e.g. RPC refused getProgramAccounts) — retry re-runs it
  | { state: "ready"; pools: LiveMutual[] };

/**
 * One unknown hit's def resolution (fail closed, D4): derive the domain_ref
 * off the account, GET the CAS, verify the served bytes hash to the
 * on-chain policyHash, parse to a riprap-def/v1 doc. Every refusal drops
 * the pool — undefined out.
 *
 * The query key matches usePolicyDoc's exactly (["policy-doc", base, seed,
 * hashHex]), so the store's scan, the generic pool page, the wizard, and
 * the juror session share one immutable-bytes cache per domain_ref.
 */
async function resolveDef(
  base: string,
  account: Mutual,
): Promise<{ def: RiprapDef } | { def: null; reason: string }> {
  const ref = await domainRefHex(account.seed, account.policyHash);
  const response = await fetch(`${base}/domains/${ref}`);
  if (response.status === 404) return { def: null, reason: "not published" };
  if (!response.ok) return { def: null, reason: `evidence server answered ${response.status}` };
  const text = await response.text();
  if ((await sha256Hex(new TextEncoder().encode(text))) !== toHex(account.policyHash)) {
    return { def: null, reason: "hash mismatch" };
  }
  const def = parseDefDoc(text);
  return def !== null ? { def } : { def: null, reason: "not a riprap-def/v1 doc" };
}

/** Every on-chain mutual on the active cluster, resolved to its listing —
 *  founder pools against data.ts, community pools against their anchored
 *  def; unknown mutuals without a valid def are dropped, never guessed. */
export function useMutualStore(): MutualStore {
  const clusterRpc = useClusterRpc();
  const evidenceBase = useEvidenceDaemonUrl();
  const { isLocal, isMainnet, isDevnet } = useCluster();
  const known = useMemo(() => knownMutuals(), [isLocal, isMainnet, isDevnet]);

  const query = useQuery({
    queryKey: ["mutuals", clusterRpc?.endpoint],
    queryFn: () => {
      if (!clusterRpc) throw new Error("no cluster rpc for the active cluster");
      return fetchAllMutuals(clusterRpc.rpc);
    },
    enabled: clusterRpc !== null,
    staleTime: 60_000,
    retry: 1,
  });

  const unknown = useMemo(
    () => (query.data ?? []).filter((hit) => !known.has(hit.address)),
    [query.data, known],
  );

  // one cached CAS read per unknown mutual — bytes immutable, so the cache
  // never goes stale; failures drop the pool for this scan (fail closed)
  const defQueries = useQueries({
    queries: unknown.map((hit) => ({
      queryKey: ["policy-doc", evidenceBase, hit.data.seed.toString(), toHex(hit.data.policyHash)],
      queryFn: () => resolveDef(evidenceBase, hit.data),
      staleTime: Number.POSITIVE_INFINITY,
      retry: 0,
    })),
  });

  const defsResolving = defQueries.some((q) => q.isPending);

  if (clusterRpc === null) return { state: "off" };
  if (query.isPending || defsResolving) return { state: "loading" };
  if (query.isError)
    return { state: "error", error: query.error, retry: () => void query.refetch() };
  const defs = new Map<Address, RiprapDef>();
  unknown.forEach((hit, i) => {
    const def = defQueries[i]?.data?.def;
    if (def != null) defs.set(hit.address, def);
  });
  return { state: "ready", pools: resolveLiveMutuals(query.data, known, defs) };
}
