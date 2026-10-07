// /app — the joined-pools table: the store scan finds every live pool, one
// membership read per pool lists the entered ones, and each row carries its
// own filing + jury-duty actions. Copy verbatim from
// meta/marketing/03-website-copy/landing-page.md § "/app — the member
// wallet surface" and § /mutuals (shared state lines); numbers render from
// the chain, never static.

import {
  type Claim,
  ClaimStatus,
  fetchAllMutuals,
  fetchMaybeClaimByNonce,
  fetchMaybeMemberByOwner,
  fetchMaybeMutual,
  type Member,
  tokenBalanceOrZero,
} from "@riprap/hanse";
import { AppProvider, getDefaultConfig } from "@solana/connector";
import type { Address, MaybeAccount } from "@solana/kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { fetchSubaccordMaybe, type Subaccord } from "@useaccord/sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeMutual } from "../pool/fixtures";
import { AppPage } from "./AppPage";

// --- hoisted mock state (vi.mock factories run before the module body) -------

const { walletState } = vi.hoisted(() => ({
  walletState: { isConnected: false, account: null as string | null },
}));

// The directory gains a second PINNED live pool for the multi-pool case —
// the store resolves scan hits against pinned pubkeys, so the pin is what
// makes the extra pool resolvable (it carries no claimFlow: filing gated).
vi.mock("../mutuals/data", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../mutuals/data")>();
  return {
    ...actual,
    MUTUALS: [
      ...actual.MUTUALS,
      {
        name: "Chairmageddon Live",
        kind: "mutual",
        slug: "chairmageddon-live",
        tagline: "test double — pinned, no flow pack",
        tiers: [{ name: "Flat", fee: 10, cap: 40 }],
        smallestPayout: 40,
        pubkey: "Chairmageddon111111111111111111111111111111111111111",
      },
    ],
  };
});

// @riprap/hanse: the read fetchers are vi.fn()s (reset per test); the real
// ClaimStatus enum rides along via importOriginal (status stamps need the
// numeric-enum reverse map).
vi.mock("@riprap/hanse", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@riprap/hanse")>();
  return {
    ...actual,
    fetchAllMutuals: vi.fn(),
    fetchMaybeMutual: vi.fn(),
    fetchMaybeMemberByOwner: vi.fn(),
    fetchMaybeClaimByNonce: vi.fn(),
    findAssociatedTokenAddress: vi.fn(async () => "1".repeat(32) as Address),
    tokenBalanceOrZero: vi.fn(),
  };
});

vi.mock("@solana/connector", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@solana/connector")>();
  return {
    ...actual,
    useWallet: () => walletState,
    useKitTransactionSigner: () => ({ signer: null }),
  };
});
vi.mock("@useaccord/sdk", () => ({
  fetchSubaccordMaybe: vi.fn(),
}));
vi.mock("../shared/rpc", () => ({
  useClusterRpc: () => ({
    endpoint: "http://127.0.0.1:8899",
    rpc: { getBalance: () => ({ send: async () => ({ value: 1n }) }) },
    rpcSubscriptions: {},
  }),
}));

const CHAIR = "Chairmageddon111111111111111111111111111111111111111" as Address;
const BLADE_DEVNET = "BXGcC19c43fzU3JyowyJrTVQ7gahtGR9o2Ca1JKSGKbe" as Address;
const scanMock = vi.mocked(fetchAllMutuals);
const subaccordMock = vi.mocked(fetchSubaccordMaybe);
const mutualMock = vi.mocked(fetchMaybeMutual);
const claimMock = vi.mocked(fetchMaybeClaimByNonce);
const memberMock = vi.mocked(fetchMaybeMemberByOwner);
const feeBalanceMock = vi.mocked(tokenBalanceOrZero);

const WALLET = "W".repeat(32);
const OTHER = "O".repeat(32);
const A = "1".repeat(32) as Address;

function maybe<T extends object>(data: T, address: Address = BLADE_DEVNET): MaybeAccount<T> {
  return { exists: true, address, data } as unknown as MaybeAccount<T>;
}

/** The raw Member fields (memberAccount's data half) — for per-pool mocks. */
function memberData(tier: number, mutual: Address = BLADE_DEVNET): Member {
  return {
    discriminator: new Uint8Array(8),
    mutual,
    member: WALLET as Address,
    tier,
    attestation: A,
    capUsed: 0n,
    bump: 255,
    padding: new Uint8Array(64),
  } as Member;
}

function memberAccount(tier: number): MaybeAccount<Member> {
  return maybe(memberData(tier));
}

const NOT_A_MEMBER = { exists: false, address: "M".repeat(32) } as unknown as MaybeAccount<Member>;

/** A paid $2,000 claim filed 2026-11-16 10:00 UTC by `claimant`. */
function claimAccount(claimant: string, over: Partial<Claim> = {}): MaybeAccount<Claim> {
  return maybe({
    discriminator: new Uint8Array(8),
    mutual: BLADE_DEVNET as Address,
    member: claimant as Address,
    claimAmount: 2_000n * 1_000_000n,
    dispute: A,
    feePaid: 15_000_000n,
    status: ClaimStatus.Paid,
    filedAt: BigInt(Date.UTC(2026, 10, 16, 10, 0) / 1000),
    settledAt: 0n,
    bump: 255,
    padding: new Uint8Array(64),
    ...over,
  } as Claim);
}

const testConfig = getDefaultConfig({ appName: "riprap-test", network: "localnet" });

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AppProvider connectorConfig={testConfig}>
        <AppPage />
      </AppProvider>
    </QueryClientProvider>,
  );
}

// The subaccord answers the pilot's live fee inputs (policy §12: (3 + 1)
// jurors × $5); the wallet's fee ATA answers $20 USDC by default — exactly
// the adjudication fee, so preflight passes. The scan answers the devnet
// blade pin by default — every covered-state test enters through it.
beforeEach(() => {
  mutualMock.mockResolvedValue(maybe(fakeMutual()));
  scanMock.mockResolvedValue([{ address: BLADE_DEVNET, data: fakeMutual() }]);
  subaccordMock.mockResolvedValue({
    exists: true,
    address: "S".repeat(32) as Address,
    data: {
      minStake: 10n * 1_000_000n,
      minJurySize: 3,
      feePerJuror: 5n * 1_000_000n,
      evidenceOperator: "E".repeat(32),
    },
  } as unknown as MaybeAccount<Subaccord>);
  feeBalanceMock.mockResolvedValue(20n * 1_000_000n);
  claimMock.mockResolvedValue({ exists: false, address: "C".repeat(32) } as MaybeAccount<Claim>);
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  walletState.isConnected = false;
  walletState.account = null;
  mutualMock.mockReset();
  scanMock.mockReset();
  memberMock.mockReset();
  claimMock.mockReset();
  feeBalanceMock.mockReset();
});

describe("/app — wallet gate (reads-only: no chain calls until connected)", () => {
  it("mounts with one main landmark, the shared nav, and the gate copy", () => {
    const { container } = renderApp();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Members' entrance");
    expect(container.querySelectorAll("main").length).toBe(1);
    expect(screen.getByRole("link", { name: "X" }).getAttribute("href")).toBe(
      "https://x.com/riprapxyz",
    );
    expect(screen.queryByRole("link", { name: "Open App" })).toBeNull();
    expect(screen.getByRole("combobox")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Connect wallet" })).toBeTruthy();
    expect(screen.getByText("Connect the wallet you joined with.")).toBeTruthy();
    expect(scanMock).not.toHaveBeenCalled();
  });

  it("'Connect a wallet' opens the picker dialog", () => {
    renderApp();
    fireEvent.click(screen.getByRole("button", { name: "Connect a wallet" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
  });
});

describe("/app — store states (shared copy, verbatim with /mutuals)", () => {
  it("scan unreachable: retry state", async () => {
    walletState.isConnected = true;
    walletState.account = WALLET;
    scanMock.mockRejectedValue(new Error("rpc down"));
    renderApp();
    expect(
      await screen.findByText("Couldn't reach the cluster.", {}, { timeout: 5000 }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });

  it("nothing live on the cluster: the honest empty state", async () => {
    walletState.isConnected = true;
    walletState.account = WALLET;
    scanMock.mockResolvedValue([]);
    renderApp();
    expect(await screen.findByText("No pools are live on this cluster yet.")).toBeTruthy();
    expect(memberMock).not.toHaveBeenCalled();
  });
});

describe("/app — the joined-pools table (data-bound to the chain)", () => {
  it("live pool, not a member: honest state, link back to the pools directory", async () => {
    walletState.isConnected = true;
    walletState.account = WALLET;
    memberMock.mockResolvedValue(NOT_A_MEMBER);
    renderApp();
    expect(await screen.findByText("This wallet isn't in any pool.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "the pools" }).getAttribute("href")).toBe("#/mutuals");
    expect(claimMock).not.toHaveBeenCalled();
  });

  it("member: hero explains the app, one row with the stamp and both button actions", async () => {
    walletState.isConnected = true;
    walletState.account = WALLET;
    memberMock.mockResolvedValue(memberAccount(1)); // Standard (policy §5 index)
    renderApp();

    // the hero band: the app's identity
    expect(await screen.findByText("The app.")).toBeTruthy();
    expect(
      screen.getByText(
        "Every mutual this wallet joined — file a payout request or sit on a jury, pool by pool.",
      ),
    ).toBeTruthy();

    // the row: name links the pool's detail route, Covered — Standard stamp
    expect(await screen.findByRole("link", { name: "Blade Pool" })).toBeTruthy();
    expect(screen.getByText("Covered — Standard")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Blade Pool" }).getAttribute("href")).toBe(
      `#/m/${BLADE_DEVNET}`,
    );
    // both buttons scoped to this pool's route id (the preflight settles async)
    await waitFor(() =>
      expect(screen.getByRole("link", { name: "File a payout request" })).toBeTruthy(),
    );
    expect(screen.getByRole("link", { name: "File a payout request" }).getAttribute("href")).toBe(
      `#/app/file-claim/${BLADE_DEVNET}`,
    );
    expect(screen.getByRole("link", { name: "Jury duty" }).getAttribute("href")).toBe(
      `#/app/adjudicate/${BLADE_DEVNET}`,
    );
    // actions are buttons: the anchors carry the kit's button chrome (asChild)
    const fileAction = screen.getByRole("link", { name: "File a payout request" });
    expect(fileAction.getAttribute("data-slot")).toBe("button");
    expect(fileAction.getAttribute("data-participate")).not.toBeNull();
    expect(screen.getByRole("link", { name: "Jury duty" }).getAttribute("data-slot")).toBe(
      "button",
    );
  });

  it("claims ride in their own band: only this wallet's claims, every field from the chain", async () => {
    walletState.isConnected = true;
    walletState.account = WALLET;
    memberMock.mockResolvedValue(memberAccount(2)); // Premium
    claimMock.mockImplementation(async (_rpc, seeds) =>
      seeds.nonce === 0n ? claimAccount(WALLET) : claimAccount(OTHER),
    );
    scanMock.mockResolvedValue([{ address: BLADE_DEVNET, data: fakeMutual({ claimNonce: 2n }) }]);
    renderApp();

    // the band label + the pool-named block
    expect(await screen.findByText("claims")).toBeTruthy();
    expect(await screen.findByText("#0 · $2,000 · PAID")).toBeTruthy();
    expect(screen.getByText("filed 2026-11-16 10:00 UTC")).toBeTruthy();
    // the other wallet's claim is filtered out — no second row, no nonce #1
    expect(screen.queryByText(/#1/)).toBeNull();
  });

  it("claims read failure: honest retry, never invented rows", async () => {
    walletState.isConnected = true;
    walletState.account = WALLET;
    memberMock.mockResolvedValue(memberAccount(0));
    claimMock.mockRejectedValue(new Error("rpc down"));
    scanMock.mockResolvedValue([{ address: BLADE_DEVNET, data: fakeMutual({ claimNonce: 1n }) }]);
    renderApp();
    expect(
      await screen.findByText("Couldn't read your claims.", {}, { timeout: 5000 }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});

describe("/app — payout-request entry action (copy doc § /app, CLAIM-WIZARD §2)", () => {
  it("preflight blocked (fee short): no payout-request action; jury duty still offered", async () => {
    walletState.isConnected = true;
    walletState.account = WALLET;
    memberMock.mockResolvedValue(memberAccount(1));
    feeBalanceMock.mockResolvedValue(1n * 1_000_000n); // $1 < the $20 adjudication fee
    renderApp();

    // claims (started with the money reads) settled — preflight evaluated
    expect(await screen.findByText("No claims filed from this wallet.")).toBeTruthy();
    await waitFor(() => expect(feeBalanceMock).toHaveBeenCalled());
    expect(screen.queryByRole("link", { name: "File a payout request" })).toBeNull();
    expect(screen.getByRole("link", { name: "Jury duty" }).getAttribute("href")).toBe(
      `#/app/adjudicate/${BLADE_DEVNET}`,
    );
  });
});

describe("/app — multi-pool listing (every entered pool gets its row)", () => {
  it("one row per entered pool; a flow-less pool offers jury duty but no filing", async () => {
    walletState.isConnected = true;
    walletState.account = WALLET;
    scanMock.mockResolvedValue([
      { address: BLADE_DEVNET, data: fakeMutual() },
      { address: CHAIR, data: fakeMutual({ tiers: [fakeMutual().tiers[0]] }) },
    ]);
    memberMock.mockImplementation(async (_rpc, seeds) =>
      maybe(memberData(seeds.mutual === CHAIR ? 0 : 1, seeds.mutual), seeds.mutual),
    );
    renderApp();

    // both rows render as entered (the stamps carry each pool's tier); each
    // pool also names its claims block in the claims band
    await waitFor(() => expect(screen.getAllByText(/^Covered —/)).toHaveLength(2));
    expect(screen.getAllByText("Blade Pool")).toHaveLength(2);
    expect(screen.getAllByText("Chairmageddon Live")).toHaveLength(2);

    // filing only where a flow pack exists (blade's preflight settles
    // async); jury duty on every row
    await waitFor(() =>
      expect(screen.getAllByRole("link", { name: "File a payout request" })).toHaveLength(1),
    );
    const juryHrefs = screen
      .getAllByRole("link", { name: "Jury duty" })
      .map((a) => a.getAttribute("href"));
    expect(juryHrefs).toContain(`#/app/adjudicate/${BLADE_DEVNET}`);
    expect(juryHrefs).toContain(`#/app/adjudicate/${CHAIR}`);
  });
});
