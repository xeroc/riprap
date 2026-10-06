// #/app/adjudicate under the on-chain binding (riprap-jfb5, spec §2–3):
// reads-only. The connect gate, the shared not-live/not-member states, the
// serve panel's honest stake states, drawn-seat cards (stamp, panel size,
// clock-derived phase, prior tally, terminal), and the session route's
// not-your-seat gate — copy verbatim from copy doc § "/app/adjudicate"
// (riprap-r8wf); every number renders from the chain, never static.

import {
  type Claim,
  ClaimStatus,
  fetchMaybeClaimByNonce,
  fetchMaybeMemberByOwner,
  fetchMaybeMutual,
  type Member,
} from "@riprap/hanse";
import { AppProvider, getDefaultConfig } from "@solana/connector";
import type { Address, MaybeAccount } from "@solana/kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import {
  type Dispute,
  DisputeState,
  fetchMaybeDispute,
  fetchMaybeJurorStake,
  fetchMaybeRound,
  type Round,
} from "@useaccord/sdk";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fakeMutual } from "../pool/fixtures";
import { AdjudicatePage } from "./AdjudicatePage";

const { walletState } = vi.hoisted(() => ({
  walletState: { isConnected: false, account: null as string | null },
}));

vi.mock("@riprap/hanse", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@riprap/hanse")>();
  return {
    ...actual,
    fetchMaybeMutual: vi.fn(),
    fetchMaybeMemberByOwner: vi.fn(),
    fetchMaybeClaimByNonce: vi.fn(),
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
vi.mock("@useaccord/sdk", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@useaccord/sdk")>();
  return {
    ...actual,
    fetchSubaccordMaybe: vi.fn(async () => ({
      exists: true,
      address: "S".repeat(32),
      data: { minStake: 10_000_000n },
    })),
    fetchMaybeDispute: vi.fn(),
    fetchMaybeRound: vi.fn(),
    fetchMaybeJurorStake: vi.fn(),
    findJurorStakePda: vi.fn(async () => ["J".repeat(32) as Address, 255]),
    findRoundPda: vi.fn(async () => ["R".repeat(32) as Address, 255]),
  };
});
vi.mock("../shared/rpc", () => ({
  useClusterRpc: () => ({
    endpoint: "http://127.0.0.1:8899",
    rpc: {},
    rpcSubscriptions: {},
  }),
  useHanseEnv: () => null, // read-only board; writes are ServeActions' tests
}));

const mutualMock = vi.mocked(fetchMaybeMutual);
const memberMock = vi.mocked(fetchMaybeMemberByOwner);
const claimMock = vi.mocked(fetchMaybeClaimByNonce);
const disputeMock = vi.mocked(fetchMaybeDispute);
const roundMock = vi.mocked(fetchMaybeRound);
const stakeMock = vi.mocked(fetchMaybeJurorStake);

const MUTUAL_ADDR = "MutualXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
const WALLET = "W".repeat(32);
const OTHER = "O".repeat(32);
const DISPUTE = "D".repeat(32) as Address;
const A = "1".repeat(32) as Address;

function maybe<T extends object>(data: T): MaybeAccount<T> {
  return { exists: true, address: MUTUAL_ADDR, data } as unknown as MaybeAccount<T>;
}
const MEMBER: MaybeAccount<Member> = maybe({
  mutual: MUTUAL_ADDR as Address,
  member: WALLET,
  tier: 1,
  attestation: A,
  bump: 255,
} as Member);

const CLAIM_WITH_DISPUTE: MaybeAccount<Claim> = maybe({
  mutual: MUTUAL_ADDR as Address,
  member: OTHER,
  claimAmount: 2_000n * 1_000_000n,
  dispute: DISPUTE,
  feePaid: 15_000_000n,
  status: ClaimStatus.Pending,
  filedAt: 1_800_000_000n,
  settledAt: 0n,
  bump: 255,
} as Claim);

/** Fixed windows: deterministic regardless of real now. FUTURE is far ahead
 * (first live phase = review); PAST forces awaiting-ruling. */
const FUTURE = { reviewEnd: 4_102_444_800n, commitEnd: 4_102_488_000n, revealEnd: 4_102_531_200n };
const PAST = { reviewEnd: 1n, commitEnd: 2n, revealEnd: 3n };

function roundAccount(over: Partial<Round> = {}): Round {
  return {
    roundIdx: 0,
    jurorCount: 3,
    commitCount: 0,
    revealCount: 0,
    drawAttempt: 0,
    settled: 0,
    bump: 255,
    pad0: new Uint8Array(0),
    ...FUTURE,
    result: 0xffff_ffff_ffff_ffffn,
    dispute: DISPUTE,
    jurors: [WALLET as Address, OTHER as Address, "X".repeat(32) as Address],
    commits: [new Uint8Array(32), new Uint8Array(32), new Uint8Array(32)],
    seatPrefix: [],
    seatStake: [],
    reveals: [],
    ...over,
  } as Round;
}
function disputeAccount(over: Partial<Dispute> = {}): MaybeAccount<Dispute> {
  return maybe({
    subaccord: A,
    filer: MUTUAL_ADDR,
    nonce: 0n,
    numOptions: 2,
    options: [new Uint8Array(32), new Uint8Array(32)],
    evidenceHashes: [new Uint8Array(32)],
    state: DisputeState.Review,
    currentRound: 0,
    terms: {} as Dispute["terms"],
    finalRuling: 0xffff_ffff_ffff_ffffn,
    ...over,
  } as Dispute);
}

const NOT_STAKED = { exists: false, address: "J".repeat(32) } as unknown as MaybeAccount<never>;
const STAKED = {
  exists: true,
  address: "J".repeat(32) as Address,
  data: { staked: 10_000_000n, feesEarned: 5_000_000n },
} as unknown as MaybeAccount<never>;

const testConfig = getDefaultConfig({ appName: "riprap-test", network: "localnet" });

function renderPage(
  mutualAddress = MUTUAL_ADDR,
  session = null as null | { dispute: string; round: number },
) {
  vi.stubEnv("VITE_LOCALNET_MUTUAL", mutualAddress);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AppProvider connectorConfig={testConfig}>
        <AdjudicatePage session={session} />
      </AppProvider>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

function connectedMemberBase() {
  walletState.isConnected = true;
  walletState.account = WALLET;
  mutualMock.mockResolvedValue(maybe(fakeMutual({ claimNonce: 1n })));
  memberMock.mockResolvedValue(MEMBER);
  claimMock.mockResolvedValue(CLAIM_WITH_DISPUTE);
  disputeMock.mockResolvedValue(disputeAccount());
  roundMock.mockResolvedValue(maybe(roundAccount()));
  stakeMock.mockResolvedValue(NOT_STAKED);
}

describe("#/app/adjudicate — frame states (copy doc § /app/adjudicate frame)", () => {
  it("no wallet: the jury gate", () => {
    renderPage();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Jury duty");
    expect(
      screen.getByText("Connect the wallet you joined with. Voting needs its signature."),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Connect a wallet" })).toBeTruthy();
  });

  it("not live on this cluster: the shared /app state", () => {
    walletState.isConnected = true;
    walletState.account = WALLET;
    renderPage(""); // no deployment on this cluster
    expect(screen.getByText("Not live on this cluster")).toBeTruthy();
  });

  it("connected, not a member: the closed-circle state", async () => {
    walletState.isConnected = true;
    walletState.account = WALLET;
    mutualMock.mockResolvedValue(maybe(fakeMutual({ claimNonce: 1n })));
    memberMock.mockResolvedValue({
      exists: false,
      address: "M".repeat(32),
    } as MaybeAccount<Member>);
    renderPage();
    expect(await screen.findByText("This wallet isn't in the pool.")).toBeTruthy();
  });
});

describe("#/app/adjudicate — board (spec §3)", () => {
  it("staked, never drawn: the honest empty state", async () => {
    connectedMemberBase();
    claimMock.mockResolvedValue({ exists: false, address: "C".repeat(32) } as MaybeAccount<Claim>);
    stakeMock.mockResolvedValue(STAKED);
    renderPage();

    expect(await screen.findByText("No seat drawn for you.")).toBeTruthy();
    expect(screen.getByText("You stay in the draw.")).toBeTruthy();
    expect(screen.getByText("Staked $10 USDC · minimum $10 USDC")).toBeTruthy();
    expect(screen.getByText("Fees earned $5 USDC")).toBeTruthy();
  });

  it("drawn seat: stamp, panel size, clock-derived phase, session link", async () => {
    connectedMemberBase();
    renderPage();

    expect(await screen.findByText("Seat — round 0")).toBeTruthy();
    expect(screen.getByText(/3 jurors/)).toBeTruthy();
    expect(screen.getByText(/review closes 2100-01/)).toBeTruthy();
    const enter = screen.getByRole("link", { name: "Enter session" });
    expect(enter.getAttribute("href")).toBe(`#/app/adjudicate/${DISPUTE}/0`);
  });

  it("round ≥ 1: the prior-round tally line", async () => {
    connectedMemberBase();
    disputeMock.mockResolvedValue(disputeAccount({ currentRound: 1, state: DisputeState.Reveal }));
    roundMock.mockImplementation(async () =>
      maybe(roundAccount({ roundIdx: 1, reveals: [0n, 1n, 0n] })),
    );
    renderPage();

    expect(await screen.findByText("Seat — round 1")).toBeTruthy();
    expect(screen.getByText("Prior round — 2 approve · 1 deny")).toBeTruthy();
  });

  it("terminal seat: concluded stamp, no session link", async () => {
    connectedMemberBase();
    disputeMock.mockResolvedValue(disputeAccount({ state: DisputeState.Final }));
    renderPage();

    expect(await screen.findByText("Seat concluded — final")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Enter session" })).toBeNull();
  });

  it("past windows: awaiting ruling", async () => {
    connectedMemberBase();
    roundMock.mockResolvedValue(maybe(roundAccount(PAST)));
    renderPage();

    expect(await screen.findByText("awaiting ruling")).toBeTruthy();
  });

  it("not staked: the serve state, minimum from the live read", async () => {
    connectedMemberBase();
    claimMock.mockResolvedValue({ exists: false, address: "C".repeat(32) } as MaybeAccount<Claim>);
    renderPage();

    expect(await screen.findByText("You're not staked for jury duty.")).toBeTruthy();
    expect(screen.getByText("Minimum $10 USDC.")).toBeTruthy();
  });
});

describe("#/app/adjudicate/:dispute/:round — session shell (spec §2)", () => {
  it("wallet not in the routed round: not your seat, nothing else renders", async () => {
    connectedMemberBase();
    roundMock.mockResolvedValue(maybe(roundAccount({ jurors: [OTHER as Address] })));
    renderPage(MUTUAL_ADDR, { dispute: DISPUTE, round: 0 });

    expect(await screen.findByText("This seat isn't yours.")).toBeTruthy();
    expect(screen.getByText("Your wallet wasn't drawn for this round.")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Enter session" })).toBeNull();
  });

  it("drawn: the round shell with clock", async () => {
    connectedMemberBase();
    renderPage(MUTUAL_ADDR, { dispute: DISPUTE, round: 0 });

    expect(await screen.findByText("Round 0")).toBeTruthy();
    expect(screen.getByText(/review closes 2100-01/)).toBeTruthy();
  });

  it("round account missing: the same honest not-your-seat state", async () => {
    connectedMemberBase();
    roundMock.mockResolvedValue({ exists: false, address: "R".repeat(32) } as MaybeAccount<Round>);
    renderPage(MUTUAL_ADDR, { dispute: DISPUTE, round: 9 });

    expect(await screen.findByText("This seat isn't yours.")).toBeTruthy();
  });
});
