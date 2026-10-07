// JuryDutyPanel — the #jurors entry panel's state layer (copy doc §
// /app/adjudicate entry panel, bean riprap-2qwq): mechanic line + one entry
// state (not staked / staked never drawn / seat drawn), consumed by the
// pool page's covered overlay. Copy verbatim from the copy doc.
import { fetchMaybeClaimByNonce } from "@riprap/hanse";
import type { Address } from "@solana/kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import {
  fetchMaybeDispute,
  fetchMaybeJurorStake,
  fetchMaybeRound,
  fetchSubaccordMaybe,
} from "@useaccord/sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JuryDutyPanel } from "./AdjudicatePage";

vi.mock("@useaccord/sdk", () => ({
  fetchSubaccordMaybe: vi.fn(),
  fetchMaybeJurorStake: vi.fn(),
  findJurorStakePda: vi.fn(async () => ["J".repeat(32)]),
  findRoundPda: vi.fn(async () => ["R".repeat(32)]),
  fetchMaybeRound: vi.fn(),
  fetchMaybeDispute: vi.fn(),
  DisputeState: { RoundResolved: 5, Final: 6, Closed: 7, Failed: 8 },
}));
vi.mock("@riprap/hanse", () => ({
  fetchMaybeClaimByNonce: vi.fn(async () => ({ exists: false, address: "C".repeat(32) })),
}));
vi.mock("../shared/rpc", () => ({
  useClusterRpc: () => ({
    endpoint: "http://127.0.0.1:8899",
    rpc: {},
    rpcSubscriptions: {},
  }),
}));

const subaccordMock = vi.mocked(fetchSubaccordMaybe);
const stakeMock = vi.mocked(fetchMaybeJurorStake);
const disputeMock = vi.mocked(fetchMaybeDispute);
const roundMock = vi.mocked(fetchMaybeRound);
const claimMock = vi.mocked(fetchMaybeClaimByNonce);

const WALLET = "W".repeat(32);

function renderPanel(claimNonce = 0n) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <JuryDutyPanel
        subaccord={"S".repeat(32) as Address}
        mutual={"M".repeat(32) as Address}
        claimNonce={claimNonce}
        wallet={WALLET as Address}
      />
    </QueryClientProvider>,
  );
}

// The subaccord answers the $10 stake floor (the mechanic line's live read).
beforeEach(() => {
  subaccordMock.mockResolvedValue({
    exists: true,
    address: "S".repeat(32),
    data: {
      minStake: 10n * 1_000_000n,
      minJurySize: 3,
      feePerJuror: 5n * 1_000_000n,
      evidenceOperator: "E".repeat(32),
    },
  } as never);
  stakeMock.mockResolvedValue({ exists: false, address: "J".repeat(32) } as never);
  claimMock.mockResolvedValue({ exists: false, address: "C".repeat(32) } as never);
});
afterEach(() => {
  cleanup();
  stakeMock.mockReset();
  disputeMock.mockReset();
  roundMock.mockReset();
  claimMock.mockReset();
  stakeMock.mockResolvedValue({ exists: false, address: "J".repeat(32) } as never);
});

describe("JuryDutyPanel — entry states (copy doc § /app/adjudicate)", () => {
  it("renders the mechanic line and the honest not-staked state with the serve CTA", async () => {
    renderPanel();

    // the min-stake read settles first ({{PARAM}} until the chain answers)
    expect(await screen.findByText("You're not staked for jury duty.")).toBeTruthy();

    const jurors = document.getElementById("jurors");
    expect(jurors?.textContent).toContain("Jurors");
    expect(jurors?.textContent).toContain(
      "Claims are settled by members who stake $10 USDC and get drawn to read the evidence.",
    );
    expect(jurors?.querySelector("[data-num]")?.textContent).toBe("$10");
    expect(screen.getByRole("link", { name: "Stake to serve" }).getAttribute("href")).toBe(
      "#/app/adjudicate",
    );
  });

  it("staked and never drawn: the honest no-seat state", async () => {
    stakeMock.mockResolvedValue({
      exists: true,
      address: "J".repeat(32),
      data: { staked: 10_000_000n, feesEarned: 0n },
    } as never);
    renderPanel();

    expect(await screen.findByText("No seat drawn for you.")).toBeTruthy();
    expect(screen.getByText("You stay in the draw. A drawn seat appears here.")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Open jury duty" })).toBeNull();
  });

  it("seat drawn: the open-duty CTA", async () => {
    stakeMock.mockResolvedValue({
      exists: true,
      address: "J".repeat(32),
      data: { staked: 10_000_000n, feesEarned: 0n },
    } as never);
    // one filed claim → its dispute is in review → round 0's panel holds
    // this wallet — the seat is drawn
    claimMock.mockResolvedValue({
      exists: true,
      address: "C".repeat(32),
      data: { member: "O".repeat(32), dispute: "D".repeat(32), status: 1 },
    } as never);
    disputeMock.mockResolvedValue({
      exists: true,
      address: "D".repeat(32),
      data: { currentRound: 0, state: 2 }, // DisputeState.Review
    } as never);
    roundMock.mockResolvedValue({
      exists: true,
      address: "R".repeat(32),
      data: { jurors: [WALLET as Address], roundIdx: 0 },
    } as never);
    renderPanel(1n);

    expect(await screen.findByText("Seat drawn for you.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Open jury duty" }).getAttribute("href")).toBe(
      "#/app/adjudicate",
    );
  });
});
