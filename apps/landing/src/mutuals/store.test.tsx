// The mutuals store tests: the getProgramAccounts scan resolves against the
// pubkey registry (data.ts); on-chain mutuals without a listing drop;
// listings without an on-chain account never surface; the output keeps the
// directory's founder display order. One registry serves every cluster —
// pubkeys are not reused across devnet/mainnet in practice, so whatever
// matches on the active cluster is live there.

import type * as HanseModule from "@riprap/hanse";
import { fetchAllMutuals, type Mutual, type ScannedAccount } from "@riprap/hanse";
import type { Address } from "@solana/kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { domainRefHex, sha256Hex } from "../pool/domainRef";
import { fakeMutual } from "../pool/fixtures";
import { MUTUALS } from "./data";
import { parseDefDoc, type RiprapDef } from "./def/schema";
import { resolveLiveMutuals, useMutualStore } from "./store";

// --- hoisted mock state (vi.mock factories run before the module body) -------

const { clusterState, rpcState } = vi.hoisted(() => ({
  clusterState: { isLocal: false, isMainnet: true, isDevnet: false },
  rpcState: { endpoint: "http://127.0.0.1:8899", rpc: { the: "rpc" }, rpcSubscriptions: {} },
}));

vi.mock("@riprap/hanse", async (importOriginal) => {
  const actual = await importOriginal<typeof HanseModule>();
  return { ...actual, fetchAllMutuals: vi.fn() };
});
vi.mock("@solana/connector", () => ({ useCluster: () => clusterState }));
vi.mock("../shared/rpc", () => ({ useClusterRpc: () => rpcState }));
const scanMock = vi.mocked(fetchAllMutuals);

const BLADE = "BladeXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
const PINNED = "PinnedXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
const UNKNOWN = "U".repeat(44);

function hit(address: string, account: Mutual = fakeMutual()): ScannedAccount<Mutual> {
  return { address: address as Address, data: account };
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("resolveLiveMutuals — scan hits × registry", () => {
  it("resolves an on-chain mutual to its listing, carrying the decoded account", () => {
    const account = fakeMutual();
    const known = new Map([[BLADE as Address, MUTUALS[1]]]);
    const live = resolveLiveMutuals([hit(BLADE, account)], known);
    expect(live).toEqual([{ listing: MUTUALS[1], address: BLADE as Address, account }]);
  });

  it("drops on-chain mutuals the registry cannot resolve — not shown", () => {
    const known = new Map([[BLADE as Address, MUTUALS[1]]]);
    expect(resolveLiveMutuals([hit(BLADE), hit(UNKNOWN)], known)).toHaveLength(1);
  });

  it("listings with nothing on-chain never surface — drafts stay drafts", () => {
    const known = new Map([
      [BLADE as Address, MUTUALS[1]],
      [PINNED as Address, MUTUALS[0]],
    ]);
    const live = resolveLiveMutuals([hit(BLADE)], known);
    expect(live.map((m) => m.listing)).toEqual([MUTUALS[1]]);
  });

  it("keeps the directory's display order regardless of scan order", () => {
    // founder order (data.ts): Chairmageddon leads, Blade Pool second
    const known = new Map([
      [BLADE as Address, MUTUALS[1]],
      [PINNED as Address, MUTUALS[0]],
    ]);
    const live = resolveLiveMutuals([hit(BLADE), hit(PINNED)], known);
    expect(live.map((m) => m.listing)).toEqual([MUTUALS[0], MUTUALS[1]]);
  });

  it("resolves an unknown hit's def to a derived listing — the community path", () => {
    const def = parseDefDoc(DEF_DOC);
    if (def === null) throw new Error("def fixture must parse");
    const known = new Map([[BLADE as Address, MUTUALS[1]]]);
    const live = resolveLiveMutuals([hit(UNKNOWN)], known, new Map([[UNKNOWN as Address, def]]));
    expect(live).toHaveLength(1);
    expect(live[0]?.address).toBe(UNKNOWN as Address);
    expect(live[0]?.def).toBe(def);
    expect(live[0]?.listing.name).toBe("Chairmageddon");
  });

  it("community pools sort after every founder, address-ordered (creation-slot stand-in)", () => {
    const def = parseDefDoc(DEF_DOC) as RiprapDef;
    const known = new Map([[BLADE as Address, MUTUALS[1]]]);
    const defs = new Map([
      [PINNED as Address, def],
      [UNKNOWN as Address, def],
    ]);
    const live = resolveLiveMutuals([hit(UNKNOWN), hit(BLADE), hit(PINNED)], known, defs);
    expect(live.map((m) => m.address)).toEqual([
      BLADE as Address,
      PINNED as Address, // "Pinned…" sorts before "UUUU…"
      UNKNOWN as Address,
    ]);
  });
});

describe("useMutualStore — the scan hook", () => {
  afterEach(() => {
    cleanup();
    scanMock.mockReset();
    delete MUTUALS.find((m) => m.slug === "blade-pool")?.pubkey; // unpin
  });

  it("pending scan: loading state", () => {
    scanMock.mockReturnValue(Promise.withResolvers<ScannedAccount<Mutual>[]>().promise);
    const { result } = renderHook(() => useMutualStore(), { wrapper });
    expect(result.current.state).toBe("loading");
  });

  it("ready: resolves resolvable hits, drops the rest — one scan against the cluster rpc", async () => {
    // the unknown hit's def read 404s — dropped, deterministic
    vi.stubGlobal("fetch", casStub({}));
    const blade = MUTUALS.find((m) => m.slug === "blade-pool");
    if (!blade) throw new Error("no blade-pool listing");
    blade.pubkey = BLADE; // pin as if deployed — restored in afterEach
    const onChain = fakeMutual();
    scanMock.mockResolvedValue([hit(UNKNOWN), hit(BLADE, onChain)]); // unknown first

    const { result } = renderHook(() => useMutualStore(), { wrapper });
    await waitFor(() => expect(result.current.state).toBe("ready"));

    if (result.current.state !== "ready") throw new Error("unreachable");
    expect(result.current.pools).toEqual([
      { listing: blade, address: BLADE as Address, account: onChain },
    ]);
    expect(scanMock).toHaveBeenCalledWith(rpcState.rpc);
  });

  it("scan failure: error state carrying the cause", async () => {
    scanMock.mockRejectedValue(new Error("gPA refused"));
    const { result } = renderHook(() => useMutualStore(), { wrapper });
    await waitFor(() => expect(result.current.state).toBe("error"), { timeout: 4000 });
    if (result.current.state !== "error") throw new Error("unreachable");
    expect((result.current.error as Error).message).toBe("gPA refused");
  });
});

// --- the CAS resolution matrix (D4: fail closed, never fallback content) ---

/** A minimal valid def doc; its sha256 becomes the account's policyHash. */
const DEF_DOC = `---
schema: "riprap-def/v1"
kind: "mutual"
slug: "chairmageddon"
name: "Chairmageddon"
period:
  start: "2026-11-15"
  end: "2026-11-17"
  claims_close: "2026-11-24"
tiers:
  - name: "Flat"
    fee: 10
    cap: 40
proof:
  - slot: "01-ticket.pdf"
    kind: "file"
    label: "your event ticket"
---
## 4. Exclusions

- Seats available when the member arrived.
`;

const hexToBytes = (hex: string) =>
  Uint8Array.from({ length: 32 }, (_, i) => Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16));

/** An account whose policyHash pins `doc`'s exact bytes. */
async function defAccount(doc: string, seed = 1n): Promise<Mutual> {
  const hashHex = await sha256Hex(new TextEncoder().encode(doc));
  return fakeMutual({ seed, policyHash: hexToBytes(hashHex) });
}

/** The CAS fetch stub: one ref → one body (or a status). */
function casStub(routes: Record<string, number | string>) {
  return vi.fn(async (url: unknown) => {
    const ref = String(url).split("/domains/")[1] ?? "";
    const route = routes[ref];
    if (route === undefined) return new Response("gone", { status: 404 });
    return typeof route === "number"
      ? new Response("err", { status: route })
      : new Response(route, { status: 200 });
  });
}

describe("useMutualStore — the community CAS resolution (fail closed)", () => {
  afterEach(() => {
    cleanup();
    scanMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("a valid def lists the pool with derived fields", async () => {
    const account = await defAccount(DEF_DOC);
    scanMock.mockResolvedValue([hit(UNKNOWN, account)]);
    const ref = await domainRefHex(account.seed, account.policyHash);
    vi.stubGlobal("fetch", casStub({ [ref]: DEF_DOC }));

    const { result } = renderHook(() => useMutualStore(), { wrapper });
    await waitFor(() => expect(result.current.state).toBe("ready"));
    if (result.current.state !== "ready") throw new Error("unreachable");
    expect(result.current.pools).toHaveLength(1);
    const pool = result.current.pools[0];
    expect(pool?.def?.slug).toBe("chairmageddon");
    expect(pool?.listing.name).toBe("Chairmageddon");
    expect(pool?.listing.tiers).toEqual([{ name: "Flat", fee: 10, cap: 40 }]);
  });

  it.each([
    [
      "CAS 404 — not published",
      async () => ({ account: await defAccount(DEF_DOC), routes: {} as Record<string, string> }),
    ],
    [
      "hash mismatch — different bytes at the ref",
      async () => {
        const account = await defAccount(DEF_DOC);
        const ref = await domainRefHex(account.seed, account.policyHash);
        return { account, routes: { [ref]: "different bytes entirely" } };
      },
    ],
    [
      "unknown schema — the doc is not a riprap-def/v1",
      async () => {
        const foreign = DEF_DOC.replace("riprap-def/v1", "other/v9");
        const account = await defAccount(foreign);
        const ref = await domainRefHex(account.seed, account.policyHash);
        return { account, routes: { [ref]: foreign } };
      },
    ],
  ])("%s — dropped", async (_name, setup) => {
    const { account, routes } = await setup();
    scanMock.mockResolvedValue([hit(UNKNOWN, account)]);
    vi.stubGlobal("fetch", casStub(routes));

    const { result } = renderHook(() => useMutualStore(), { wrapper });
    await waitFor(() => expect(result.current.state).toBe("ready"));
    if (result.current.state !== "ready") throw new Error("unreachable");
    expect(result.current.pools).toEqual([]);
  });
});
