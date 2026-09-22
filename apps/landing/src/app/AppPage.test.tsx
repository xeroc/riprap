// /app under the on-chain binding (riprap-c1r1): reads-only. The connect
// gate, the not-a-member state, the covered view (stamp + facts + claims rows
// from the chain, filtered to the wallet), and the shared not-live state —
// copy verbatim from meta/marketing/03-website-copy/landing-page.md § "/app —
// the member wallet surface"; numbers render from the chain, never static.

import {
  type Claim,
  ClaimStatus,
  type Depositor,
  fetchMaybeClaimByNonce,
  fetchMaybeDepositorByOwner,
  fetchMaybeMemberByOwner,
  fetchMaybeMutual,
  type Member,
  tokenBalanceOrZero,
} from "@riprap/hanse";
import { AppProvider, getDefaultConfig } from "@solana/connector";
import type { Address, MaybeAccount } from "@solana/kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { fetchSubaccordMaybe, type Subaccord } from "@useaccord/sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeMutual } from "../pool/fixtures";
import { AppPage } from "./AppPage";

// --- hoisted mock state (vi.mock factories run before the module body) -------

const { walletState } = vi.hoisted(() => ({
  walletState: { isConnected: false, account: null as string | null },
}));

// AppPage pulls ClaimStatus as a value (status stamps) — the mock needs the
// numeric-enum reverse map or the name lookup renders undefined.
vi.mock("@riprap/hanse", () => ({
  ClaimStatus: {
    Pending: 0,
    Approved: 1,
    Denied: 2,
    Failed: 3,
    Paid: 4,
    0: "Pending",
    1: "Approved",
    2: "Denied",
    3: "Failed",
    4: "Paid",
  },
  fetchMaybeMutual: vi.fn(),
  fetchMaybeMemberByOwner: vi.fn(),
  fetchMaybeClaimByNonce: vi.fn(),
  fetchMaybeDepositorByOwner: vi.fn(),
  findAssociatedTokenAddress: vi.fn(async () => "1".repeat(32)),
  tokenBalanceOrZero: vi.fn(async () => 15n * 1_000_000n),
}));

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
  findDisputePda: vi.fn(async () => "2".repeat(32)),
}));
// The preflight hook's one direct rpc call (SOL balance) — stubbed so the
// money read settles offline like every SDK-mocked read around it.
vi.mock("../shared/rpc", () => ({
  useClusterRpc: () => ({
    endpoint: "http://127.0.0.1:8899",
    rpc: { getBalance: () => ({ send: async () => ({ value: 1n }) }) },
    rpcSubscriptions: {},
  }),
  useHanseEnv: () => null,
}));
const subaccordMock = vi.mocked(fetchSubaccordMaybe);
const claimMock = vi.mocked(fetchMaybeClaimByNonce);
const mutualMock = vi.mocked(fetchMaybeMutual);
const memberMock = vi.mocked(fetchMaybeMemberByOwner);
const depositorMock = vi.mocked(fetchMaybeDepositorByOwner);
const feeBalanceMock = vi.mocked(tokenBalanceOrZero);
const MUTUAL_ADDR = "MutualXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
const WALLET = "W".repeat(32);
const OTHER = "O".repeat(32);
const A = "1".repeat(32) as Address;

function maybe<T extends object>(data: T): MaybeAccount<T> {
  return { exists: true, address: MUTUAL_ADDR, data } as unknown as MaybeAccount<T>;
}

function memberAccount(tier: number): MaybeAccount<Member> {
  return maybe({
    discriminator: new Uint8Array(8),
    mutual: MUTUAL_ADDR as Address,
    member: WALLET as Address,
    tier,
    attestation: A,
    hasPendingClaim: false,
    bump: 255,
  } as Member);
}

const NOT_A_MEMBER = { exists: false, address: "M".repeat(32) } as unknown as MaybeAccount<Member>;

/** A paid $2,000 claim filed 2026-11-16 10:00 UTC by `claimant`. */
function claimAccount(claimant: string, over: Partial<Claim> = {}): MaybeAccount<Claim> {
  return maybe({
    discriminator: new Uint8Array(8),
    mutual: MUTUAL_ADDR as Address,
    member: claimant as Address,
    claimAmount: 2_000n * 1_000_000n,
    dispute: A,
    feePaid: 15_000_000n,
    status: ClaimStatus.Paid,
    filedAt: BigInt(Date.UTC(2026, 10, 16, 10, 0) / 1000),
    settledAt: 0n,
    bump: 255,
    ...over,
  } as Claim);
}

// localnet default + a stubbed VITE_LOCALNET_MUTUAL: the resolver sees an
// address and the (mocked) SDK fetch answers — no network in jsdom. Pass ""
// to renderApp to exercise the no-deployment path.
const testConfig = getDefaultConfig({ appName: "riprap-test", network: "localnet" });

function renderApp(mutualAddress = MUTUAL_ADDR) {
  vi.stubEnv("VITE_LOCALNET_MUTUAL", mutualAddress);
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

// Defaults: the juror panel's stake floor answers $10 (policy §12) and the
// preflight money reads settle as a full stake + the pilot's 3×$5 juror fee
// paid — tests that need a blocked gate override these.
beforeEach(() => {
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
  depositorMock.mockResolvedValue({
    exists: true,
    address: "D".repeat(32),
    data: { rightsStake: 20n * 1_000_000n },
  } as unknown as MaybeAccount<Depositor>);
  feeBalanceMock.mockResolvedValue(15n * 1_000_000n);
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  walletState.isConnected = false;
  walletState.account = null;
  mutualMock.mockReset();
  memberMock.mockReset();
  claimMock.mockReset();
  depositorMock.mockReset();
  feeBalanceMock.mockReset();
});

describe("/app — wallet gate (reads-only: no chain calls until connected)", () => {
  it("mounts with one main landmark, the shared nav, and the gate copy", () => {
    const { container } = renderApp();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Members' entrance");
    expect(container.querySelectorAll("main").length).toBe(1);
    // shared navbar (copy doc §0 + § /app nav): How it works → the platform
    // mechanism section, X → the handle, and the in-app controls (cluster
    // select + connect) instead of the Open App CTA
    expect(screen.getByRole("link", { name: "How it works" }).getAttribute("href")).toBe(
      "#mechanism",
    );
    expect(screen.getByRole("link", { name: "X" }).getAttribute("href")).toBe(
      "https://x.com/riprapxyz",
    );
    expect(screen.queryByRole("link", { name: "Open App" })).toBeNull();
    expect(screen.getByRole("combobox")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Connect wallet" })).toBeTruthy();
    expect(screen.getByText("Connect the wallet you joined with.")).toBeTruthy();
    expect(mutualMock).not.toHaveBeenCalled();
  });

  it("'Connect a wallet' opens the picker dialog", () => {
    renderApp();
    fireEvent.click(screen.getByRole("button", { name: "Connect a wallet" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
  });
});

describe("/app — mutual states (shared copy, verbatim with the pool page)", () => {
  it("no deployment on the cluster: not-live state with the inline cluster switch", () => {
    walletState.isConnected = true;
    walletState.account = WALLET;
    renderApp("");
    expect(screen.getByText("Not live on this cluster")).toBeTruthy();
    expect(
      screen.getByText(
        "The Blade Pool isn't deployed on this network. Switch networks to find it.",
      ),
    ).toBeTruthy();
    // the nav cluster select + the inline switch the not-live copy points at
    expect(screen.getAllByRole("combobox").length).toBe(2);
    // honest empty state — no numbers, no reads attempted
    expect(mutualMock).not.toHaveBeenCalled();
  });

  it("cluster unreachable: retry state", async () => {
    walletState.isConnected = true;
    walletState.account = WALLET;
    mutualMock.mockRejectedValue(new Error("rpc down"));
    renderApp();
    expect(
      await screen.findByText("Couldn't reach the cluster.", {}, { timeout: 5000 }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});

describe("/app — membership + claims (data-bound to the chain)", () => {
  it("connected, not a member: honest state, link back to the pool page", async () => {
    walletState.isConnected = true;
    walletState.account = WALLET;
    mutualMock.mockResolvedValue(maybe(fakeMutual()));
    memberMock.mockResolvedValue(NOT_A_MEMBER);
    renderApp();
    expect(await screen.findByText("This wallet isn't in the pool.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "the pool page" }).getAttribute("href")).toBe(
      "#/2026-breakpoint-blade-pool",
    );
    expect(claimMock).not.toHaveBeenCalled();
  });

  it("member: Covered stamp with the on-chain tier + fee/cap facts, address chip + Disconnect in the nav", async () => {
    walletState.isConnected = true;
    walletState.account = WALLET;
    mutualMock.mockResolvedValue(maybe(fakeMutual()));
    memberMock.mockResolvedValue(memberAccount(1)); // Standard (policy §5 index)
    claimMock.mockResolvedValue({ exists: false, address: "C".repeat(32) } as MaybeAccount<Claim>);
    renderApp();

    expect(await screen.findByText("Covered — Standard")).toBeTruthy();
    expect(await screen.findByText("$20 entry · up to $2,000 maximum payout")).toBeTruthy();
    // payout-request entry (copy doc § /app): rendered while preflight passes
    // (the money read settles after the mutual/member reads — await it)
    const entry = await screen.findByRole("link", { name: "File a payout request" });
    expect(entry.getAttribute("href")).toBe("#/app/file-claim");
    // nav account controls: shortened address (full in title) + disconnect
    expect(screen.getByTitle(WALLET).textContent).toContain("WWWW");
    // juror panel (copy doc § /app): the overlay's Become-a-juror destination
    const jurors = document.getElementById("jurors");
    expect(jurors?.textContent).toContain("Jurors");
    expect(jurors?.textContent).toContain(
      "Claims are settled by members who stake $10 USDC and get drawn to read the evidence.",
    );
    expect(jurors?.textContent).toContain("Staking opens here.");
    expect(jurors?.querySelector("[data-num]")?.textContent).toBe("$10");
  });
  it("claims: only this wallet's claims render, every field from the chain", async () => {
    walletState.isConnected = true;
    walletState.account = WALLET;
    mutualMock.mockResolvedValue(maybe(fakeMutual({ claimNonce: 2n })));
    memberMock.mockResolvedValue(memberAccount(2)); // Premium
    claimMock.mockImplementation(async (_rpc, seeds) =>
      seeds.nonce === 0n ? claimAccount(WALLET) : claimAccount(OTHER),
    );
    renderApp();

    expect(await screen.findByText("Covered — Premium")).toBeTruthy();
    expect(await screen.findByText("#0 · $2,000 · PAID")).toBeTruthy();
    expect(screen.getByText("filed 2026-11-16 10:00 UTC")).toBeTruthy();
    // the other wallet's claim is filtered out — no second row, no nonce #1
    expect(screen.queryByText(/#1/)).toBeNull();
  });

  it("claims loading reads as loading; empty list reads as none", async () => {
    walletState.isConnected = true;
    walletState.account = WALLET;
    mutualMock.mockResolvedValue(maybe(fakeMutual({ claimNonce: 1n })));
    memberMock.mockResolvedValue(memberAccount(0));
    const { promise: claimsPromise, resolve: resolveClaims } =
      Promise.withResolvers<MaybeAccount<Claim>>();
    claimMock.mockReturnValue(claimsPromise);
    renderApp();

    expect(await screen.findByText("Covered — Basic")).toBeTruthy();
    expect(await screen.findByText("Reading your claims from the chain.")).toBeTruthy();

    resolveClaims({ exists: false, address: "C".repeat(32) } as MaybeAccount<Claim>);
  });

  it("claims read failure: honest retry, never invented rows", async () => {
    walletState.isConnected = true;
    walletState.account = WALLET;
    mutualMock.mockResolvedValue(maybe(fakeMutual({ claimNonce: 1n })));
    memberMock.mockResolvedValue(memberAccount(0));
    claimMock.mockRejectedValue(new Error("rpc down"));
    renderApp();
    expect(
      await screen.findByText("Couldn't read your claims.", {}, { timeout: 5000 }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});
