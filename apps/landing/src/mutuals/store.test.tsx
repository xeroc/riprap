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

import { fakeMutual } from "../pool/fixtures";
import { MUTUALS } from "./data";
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
