// The pool page under the on-chain binding (milestone riprap-9ehc): tiers,
// slider, CTA and the §5 fineprint table render from mutual.tiers; every
// other state renders the copy doc's on-chain strings verbatim
// (meta/marketing/03-website-copy/landing-page.md § "On-chain states + juror
// modal") with {{PARAM}} mono placeholders — never static fallback numbers.
// The chip-in is the one-tx join machine (HANDOFF §4): building →
// wallet-signing → confirming → covered, pre-check disables, the Covered
// stamp for an existing member, and describeError toasts on failure.

import {
  buildJoinInstructions,
  fetchMaybeMutual,
  fetchPool,
  getJoinContext,
  type JoinContext,
  type Mutual,
  type Pool,
} from "@riprap/hanse";
import { AppProvider, getDefaultConfig } from "@solana/connector";
import type { Account, Address, Instruction, MaybeAccount, TransactionSigner } from "@solana/kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { fetchSubaccordMaybe, type Subaccord } from "@useaccord/sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SUPPORTERS } from "../sections/Supporters";
import { sendInstruction, TransactionSendError } from "../shared/transaction";
import { BreakpointPage } from "./BreakpointPage";
import { fakeMutual, POLICY_TIERS } from "./fixtures";

// --- hoisted mock state (vi.mock factories run before the module body) -------

const { walletState, signerStub, toastError } = vi.hoisted(() => ({
  walletState: { isConnected: false, account: null as string | null },
  signerStub: { address: "W".repeat(32) },
  toastError: vi.fn(),
}));

vi.mock("@riprap/hanse", () => ({
  fetchMaybeMutual: vi.fn(),
  fetchPool: vi.fn(),
  getJoinContext: vi.fn(),
  buildJoinInstructions: vi.fn(),
}));

vi.mock("@solana/connector", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@solana/connector")>();
  return {
    ...actual,
    useWallet: () => walletState,
    useKitTransactionSigner: () => ({ signer: walletState.isConnected ? signerStub : null }),
  };
});

vi.mock("../shared/transaction", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../shared/transaction")>();
  return { ...actual, sendInstruction: vi.fn() };
});
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { error: toastError }) }));

vi.mock("@useaccord/sdk", () => ({ fetchSubaccordMaybe: vi.fn() }));
// The anchored-terms band fetches from the evidence daemon — keep page tests
// off the network; the band's own suite covers its states.
vi.mock("../usePolicyDoc", () => ({
  evidenceBaseUrl: () => "https://api.useaccord.xyz",
  usePolicyDoc: vi.fn(() => ({ state: "idle", refetch: () => {} })),
}));

const fetchMock = vi.mocked(fetchMaybeMutual);
const joinMock = vi.mocked(getJoinContext);
const buildMock = vi.mocked(buildJoinInstructions);
const sendMock = vi.mocked(sendInstruction);
const subaccordMock = vi.mocked(fetchSubaccordMaybe);
const poolMock = vi.mocked(fetchPool);

type Maybe = MaybeAccount<Mutual>;

const MUTUAL_ADDR = "MutualXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
const WALLET = "W".repeat(32);

function maybe(mutual: Mutual): Maybe {
  return { exists: true, address: MUTUAL_ADDR, data: mutual } as unknown as Maybe;
}

const NOT_FOUND = { exists: false, address: MUTUAL_ADDR } as unknown as Maybe;

/** The subaccord stake floor (policy §12 / messaging-guide Numbers: $10). */
function subaccord(minStake = 10n * 1_000_000n): MaybeAccount<Subaccord> {
  return {
    exists: true,
    address: "S".repeat(32) as Address,
    data: { minStake },
  } as unknown as MaybeAccount<Subaccord>;
}

/** The pool account: total_amount sums member contributions (micro-USDC). */
function poolAccount(totalAmount = 4020n * 1_000_000n) {
  return { address: "P".repeat(32) as Address, data: { totalAmount } } as unknown as Account<Pool>;
}

const joinIx = {
  programAddress: "J".repeat(32) as Address,
  accounts: [],
  data: new Uint8Array(),
} as Instruction;

/** A joinable context: $100 USDC, funded SOL, no member PDA (facade §2). */
function joinCtx(overrides: Partial<JoinContext> = {}): JoinContext {
  return {
    mutual: maybe(fakeMutual()) as unknown as JoinContext["mutual"],
    memberAccount: "M".repeat(32) as Address,
    alreadyMember: null,
    contribution: POLICY_TIERS[0].contribution,
    depositBalance: 100n * 1_000_000n,
    solBalance: 5_000_000_000n,
    depositsOpen: true,
    canJoin: true,
    ...overrides,
  };
}

// localnet default + a stubbed VITE_LOCALNET_MUTUAL: the resolver sees an
// address and the (mocked) SDK fetch answers — no network in jsdom. Pass ""
// to renderPoolPage to exercise the no-deployment path.
const testConfig = getDefaultConfig({ appName: "riprap-test", network: "localnet" });

function renderPoolPage(mutualAddress = MUTUAL_ADDR) {
  vi.stubEnv("VITE_LOCALNET_MUTUAL", mutualAddress);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AppProvider connectorConfig={testConfig}>
        <BreakpointPage />
      </AppProvider>
    </QueryClientProvider>,
  );
}

// Default: the subaccord answers with the policy §12 floor ($10). Connected
// tests that don't care still get a well-formed min-stake read — an unset
// vi.fn() returns undefined and TanStack rejects the query.
beforeEach(() => {
  subaccordMock.mockResolvedValue(subaccord());
  poolMock.mockResolvedValue(poolAccount());
  // the covered overlay gates once per wallet per session (copy doc §
  // Covered overlay) — every test starts with the moment available
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  walletState.isConnected = false;
  walletState.account = null;
  fetchMock.mockReset();
  joinMock.mockReset();
  buildMock.mockReset();
  sendMock.mockReset();
  toastError.mockClear();
  subaccordMock.mockReset();
});

describe("/2026-breakpoint-blade-pool — ready state (tiers from mutual.tiers, policy §5)", () => {
  it("names the peril the platform landing must not", async () => {
    fetchMock.mockResolvedValue(maybe(fakeMutual()));
    renderPoolPage();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Get stabbed with friends.");
    // naming lock is a platform-page rule; the policy page states it plainly
    expect(document.body.textContent).toMatch(/knife assault/i);
    await screen.findByText("Standard · $20 entry · up to $2,000 maximum payout");
  });

  it("tier slider defaults to Standard and moves through exactly the three on-chain tiers", async () => {
    fetchMock.mockResolvedValue(maybe(fakeMutual()));
    renderPoolPage();
    await screen.findByText("Standard · $20 entry · up to $2,000 maximum payout");
    const thumb = screen.getByRole("slider");
    fireEvent.keyDown(thumb, { key: "ArrowRight" });
    expect(screen.getByText("Premium · $40 entry · up to $4,000 maximum payout")).toBeTruthy();
    expect(screen.getByText("you've read the news")).toBeTruthy();
    fireEvent.keyDown(thumb, { key: "ArrowLeft" });
    fireEvent.keyDown(thumb, { key: "ArrowLeft" });
    expect(screen.getByText("Basic · $10 entry · up to $1,000 maximum payout")).toBeTruthy();
    expect(screen.getByText("you're probably fine")).toBeTruthy();
  });

  it("shows the deposits window from deposits_close_at (chain truth)", async () => {
    fetchMock.mockResolvedValue(
      maybe(fakeMutual({ depositsCloseAt: BigInt(Date.UTC(2026, 10, 15, 9, 30) / 1000) })),
    );
    renderPoolPage();
    expect(await screen.findByText("entry closes 2026-11-15 09:30 UTC")).toBeTruthy();
  });

  it("the odds table carries the four ludic rows, jokes never touching the math", async () => {
    fetchMock.mockResolvedValue(maybe(fakeMutual()));
    const { container } = renderPoolPage();
    await screen.findByText("Standard · $20 entry · up to $2,000 maximum payout");
    const rows = [...container.querySelectorAll('[data-slot="odds"] tbody tr')].map(
      (tr) => tr.textContent,
    );
    expect(rows).toEqual([
      "You get stabbed at Breakpointstatistically negligible",
      "Accidental eye contact on the Tubecertain",
      "The pool dissolves on schedule100% — it's a program",
      "You send this page to the group chathigh",
    ]);
  });

  it("hero split (2026-09-24): supporters left in the odds table's old slot, odds a right rail", async () => {
    fetchMock.mockResolvedValue(maybe(fakeMutual()));
    const { container } = renderPoolPage();
    await screen.findByText("Standard · $20 entry · up to $2,000 maximum payout");

    // the odds table lives in a right rail beside the headline stack
    const rail = container.querySelector('[data-slot="odds"]')?.closest("aside") ?? null;
    expect(rail).not.toBeNull();
    const lane = rail!.parentElement!;
    const left = lane.firstElementChild as HTMLElement;
    // the h1 stays the first look — it leads the left column
    expect(left.querySelector("h1")?.textContent).toBe("Get stabbed with friends.");

    // supporters sit where the odds table sat: after the subline, before the
    // tier picker; the discs are exactly the committed supporters.json
    const slot = left.querySelector('[data-slot="supporters"]');
    if (SUPPORTERS.length === 0) {
      expect(slot).toBeNull(); // no invented discs (kit data law)
      return;
    }
    expect([...slot!.querySelectorAll("a")].map((a) => a.getAttribute("href"))).toEqual(
      SUPPORTERS.map((s) => s.url),
    );
    const picker = left.querySelector('[data-slot="tier-picker"]')!;
    expect(slot!.compareDocumentPosition(picker) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("no wallet: 'Connect a wallet to chip in' opens the picker and reads no join context", async () => {
    fetchMock.mockResolvedValue(maybe(fakeMutual()));
    renderPoolPage();
    fireEvent.click(await screen.findByRole("button", { name: "Connect a wallet to chip in" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(joinMock).not.toHaveBeenCalled();
  });

  it("fineprint: all 13 policy categories, all 8 exclusions, §5 table from mutual.tiers", async () => {
    fetchMock.mockResolvedValue(maybe(fakeMutual()));
    const { container } = renderPoolPage();
    await screen.findByText("Standard · $20 entry · up to $2,000 maximum payout");
    const sections = [...container.querySelectorAll('[data-slot="policy-section"]')];
    expect(sections.length).toBe(13);
    const headings = sections.map((s) => s.querySelector("span.uppercase")?.textContent ?? "");
    expect(headings).toEqual([
      "Product",
      "Coverage period",
      "Covered event",
      "Exclusions",
      "Coverage tiers",
      "Pool",
      "Payout requests",
      "Pool dissolution",
      "Economic principle",
      "Worked example — Standard tier",
      "Product promise",
      "Legal status",
      "Counsel's recommendations",
    ]);
    // §4: exactly the eight exclusions from the policy
    const exclusions = container.querySelectorAll(
      '[data-slot="policy-section"] [data-slot="policy-exclusions"] li',
    );
    expect(exclusions.length).toBe(8);
    // §5: table bound to mutual.tiers — all six prices present, mono, data-num
    const nums = [...container.querySelectorAll('[data-slot="policy-section"] td[data-num]')].map(
      (td) => td.textContent,
    );
    expect(nums).toEqual(["$10", "up to $1,000", "$20", "up to $2,000", "$40", "up to $4,000"]);
    // §7: the subaccord stamp — the fineprint's one link, bound to mutual.subaccord
    // (copy doc § on-chain states: full address in href + title, head…tail display)
    const stampLinks = [
      ...container.querySelectorAll<HTMLAnchorElement>('[data-slot="policy-section"] a'),
    ];
    expect(stampLinks.length).toBe(1);
    expect(stampLinks[0].getAttribute("href")).toBe(
      `https://app.useaccord.xyz/#/subaccords/${"1".repeat(32)}`,
    );
    expect(stampLinks[0].getAttribute("title")).toBe("1".repeat(32));
    expect(stampLinks[0].textContent).toContain("1111…1111");
    expect(container.textContent).toContain("ADJUDICATION · SUBACCORD");
    // the anchored-terms band is wired under the fineprint (heading per copy
    // doc § Anchored terms band, 2026-09-21 revision)
    expect(container.textContent).toContain("The immutable terms of this mutual.");
    // §7/§12: discretion and liability stated plainly — counsel recs 2 and 3
    expect(container.textContent).toContain("enforceable right to any payment");
    expect(container.textContent).toContain("no limited liability");
    // §13: the five counsel recommendations render
    const recs = container.querySelectorAll('[data-slot="policy-recommendations"] li');
    expect(recs.length).toBe(5);
  });
});

describe("chip-in — the one-tx join machine (HANDOFF §4, copy doc § on-chain states)", () => {
  it("connected + joinable: click walks building → wallet-signing → confirming → covered", async () => {
    walletState.isConnected = true;
    walletState.account = WALLET;
    fetchMock.mockResolvedValue(maybe(fakeMutual()));
    joinMock.mockResolvedValue(joinCtx());
    subaccordMock.mockResolvedValue(subaccord());
    let resolveBuild!: (v: Instruction[]) => void;
    buildMock.mockReturnValue(
      new Promise<Instruction[]>((resolve) => {
        resolveBuild = resolve;
      }),
    );
    let fireSubmitted: (() => void) | undefined;
    let resolveSend!: (sig: string) => void;
    sendMock.mockImplementation(
      (_rpc, _rpcSubscriptions, _signer, _instructions, onSubmitted?: () => void) =>
        new Promise<string>((resolve) => {
          fireSubmitted = () => onSubmitted?.();
          resolveSend = resolve;
        }),
    );

    renderPoolPage();
    fireEvent.click(await screen.findByRole("button", { name: "Chip in $20" }));

    expect(screen.getByRole("button", { name: "Building…" })).toBeTruthy();
    resolveBuild([joinIx]);
    expect(await screen.findByText("Check your wallet…")).toBeTruthy();
    fireSubmitted?.();
    expect(await screen.findByText("Confirming…")).toBeTruthy();
    resolveSend("sig");

    expect(await screen.findByText("Covered — Standard")).toBeTruthy();

    // the covered overlay fires on confirmation — the join moment (copy doc
    // § Covered overlay): stamp, headline, the three figures (total last,
    // chain-formatted), the juror field, the share field, Continue. Assert and
    // dismiss FIRST: an open Radix dialog aria-hides the rest of the page.
    const dialog = await screen.findByRole("dialog");
    expect(dialog.textContent).toContain("You're in the ring.");
    expect(dialog.textContent).toContain("$20");
    expect(dialog.textContent).toContain("up to $2,000");
    await waitFor(() => expect(dialog.textContent).toContain("pool holds $4,020"));
    expect(dialog.textContent).toContain(
      "get drawn to read the evidence, get paid when coherent. Unstake anytime.",
    );
    expect(dialog.querySelector('[data-slot="covered-juror"] a')?.getAttribute("href")).toBe(
      "#/app#jurors",
    );
    // the share field (copy doc § Covered overlay, 2026-09-24): the note with
    // the supporter twist, composer intents carrying the member's figures
    expect(dialog.textContent).toContain(
      "Post it with @riprapxyz — everyone who shares lands on the front page as a supporter",
    );
    const shareX = dialog.querySelector('[data-slot="covered-share"] a[aria-label="Share on X"]');
    expect(shareX?.getAttribute("href")).toContain(
      encodeURIComponent("$20 in, up to $2,000 out — "),
    );
    expect(shareX?.getAttribute("href")).toContain(encodeURIComponent("@riprapxyz"));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    // the slider locks and the app link appears (copy doc § Covered)
    // Radix restores page aria-hidden a tick after unmount — wait it out
    await waitFor(() => expect(screen.getByRole("slider").getAttribute("data-disabled")).toBe(""));
    expect(screen.getByRole("link", { name: "the app" }).getAttribute("href")).toBe("#/app");

    // the facade built against the static address + chosen tier + wallet signer
    expect(buildMock).toHaveBeenCalledWith(expect.anything(), {
      mutual: MUTUAL_ADDR,
      tier: 1,
      member: signerStub as unknown as TransactionSigner,
    });
    // one send, carrying the built bundle and the Confirming… seam
    expect(sendMock).toHaveBeenCalledTimes(1);
    const sendCall = sendMock.mock.calls[0];
    expect(sendCall?.[2]).toBe(signerStub);
    expect(sendCall?.[3]).toEqual([joinIx]);
    expect(typeof sendCall?.[4]).toBe("function");
  });

  it("failure: one-line toast from the program logs, hero back to idle, context refetched", async () => {
    walletState.isConnected = true;
    walletState.account = WALLET;
    fetchMock.mockResolvedValue(maybe(fakeMutual()));
    joinMock.mockResolvedValue(joinCtx());
    buildMock.mockResolvedValue([joinIx]);
    sendMock.mockRejectedValue(
      new TransactionSendError(
        "Transaction simulation failed: 2\n  Program log: Error: Custom: 6003",
        ["Program log: Error: Custom: 6003"],
        "InstructionError",
      ),
    );

    renderPoolPage();
    fireEvent.click(await screen.findByRole("button", { name: "Chip in $20" }));

    await waitFor(() => expect(toastError).toHaveBeenCalledTimes(1));
    expect(toastError).toHaveBeenCalledWith("Custom: 6003");
    // idle again — the chip-in button is back and clickable
    expect(await screen.findByRole("button", { name: "Chip in $20" })).toBeTruthy();
    // the join context was refetched after the failure (HANDOFF §4)
    await waitFor(() => expect(joinMock).toHaveBeenCalledTimes(2));
  });
});

describe("balance pre-checks — chip-in disabled with an inline reason (copy doc § on-chain states)", () => {
  it("insufficient USDC: disabled + `Not enough USDC. This wallet holds {{balance}}; the {{tier}} tier costs {{fee}}.`, tracking the selected tier", async () => {
    walletState.isConnected = true;
    walletState.account = WALLET;
    fetchMock.mockResolvedValue(maybe(fakeMutual()));
    joinMock.mockResolvedValue(
      joinCtx({
        depositBalance: 5n * 1_000_000n,
        canJoin: false,
        reason: "insufficient-balance",
      }),
    );

    renderPoolPage();
    const chipIn = await screen.findByRole("button", { name: "Chip in $20" });
    expect(chipIn.hasAttribute("disabled")).toBe(true);
    expect(
      screen.getByText("Not enough USDC. This wallet holds $5; the Standard tier costs $20."),
    ).toBeTruthy();
    // localnet: no faucet link (devnet-only copy)
    expect(screen.queryByRole("link", { name: /faucet/i })).toBeNull();

    // per-tier affordability is the page's call: Basic still unaffordable at $5
    const thumb = screen.getByRole("slider");
    fireEvent.keyDown(thumb, { key: "ArrowLeft" });
    fireEvent.keyDown(thumb, { key: "ArrowLeft" });
    expect(
      await screen.findByText("Not enough USDC. This wallet holds $5; the Basic tier costs $10."),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Chip in $10" }).hasAttribute("disabled")).toBe(true);
  });

  it("insufficient SOL: `You'll also need SOL for network fees.` and the button stays down", async () => {
    walletState.isConnected = true;
    walletState.account = WALLET;
    fetchMock.mockResolvedValue(maybe(fakeMutual()));
    joinMock.mockResolvedValue(
      joinCtx({ solBalance: 0n, canJoin: false, reason: "insufficient-sol" }),
    );

    renderPoolPage();
    expect(await screen.findByText("You'll also need SOL for network fees.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Chip in $20" }).hasAttribute("disabled")).toBe(true);
  });
});

describe("covered — an existing member is a state, never an error toast", () => {
  it("renders the Covered stamp with their on-chain tier, locks the slider, links the app", async () => {
    walletState.isConnected = true;
    walletState.account = WALLET;
    fetchMock.mockResolvedValue(maybe(fakeMutual()));
    joinMock.mockResolvedValue(
      joinCtx({ alreadyMember: { tier: 0 }, canJoin: false, reason: "already-member" }),
    );

    renderPoolPage();

    // a connecting member gets the moment too — the overlay fires on the
    // session's first covered read (copy doc § Covered overlay). Dismiss it
    // first: an open dialog aria-hides the inline state.
    const dialog = await screen.findByRole("dialog");
    expect(dialog.textContent).toContain("Covered — Basic");
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    expect(await screen.findByText("Covered — Basic")).toBeTruthy();
    const coveredSlot = screen
      .getAllByText("Covered — Basic")
      .map((el) => el.closest('[data-slot="covered"]'));
    expect(
      coveredSlot.some((slot) =>
        slot?.textContent?.includes(
          "This wallet is in the pool. Your membership and claims live in the app.",
        ),
      ),
    ).toBe(true);
    expect(screen.getByRole("link", { name: "the app" }).getAttribute("href")).toBe("#/app");
    await waitFor(() => expect(screen.getByRole("slider").getAttribute("data-disabled")).toBe(""));
    // their tier line, from their on-chain member PDA
    expect(screen.getByText("Basic · $10 entry · up to $1,000 maximum payout")).toBeTruthy();
    // the session gate is set — the moment already happened for this wallet
    expect(sessionStorage.getItem(`riprap:covered:${WALLET}`)).toBe("1");
  });

  it("the moment is once per session: a second covered read opens no overlay", async () => {
    walletState.isConnected = true;
    walletState.account = WALLET;
    fetchMock.mockResolvedValue(maybe(fakeMutual()));
    joinMock.mockResolvedValue(
      joinCtx({ alreadyMember: { tier: 1 }, canJoin: false, reason: "already-member" }),
    );

    const first = renderPoolPage();
    fireEvent.click(await screen.findByRole("button", { name: "Continue" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    first.unmount();

    // same session, same wallet: the inline state only, no second moment
    renderPoolPage();
    expect(await screen.findByText("Covered — Standard")).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("loading — {{PARAM}} placeholders, no static numbers (copy doc § on-chain states)", () => {
  it("reads 'Reading the pool from the chain.' and disables the picker", async () => {
    fetchMock.mockReturnValue(new Promise<Maybe>(() => {}));
    const { container } = renderPoolPage();
    expect(await screen.findByText("Reading the pool from the chain.")).toBeTruthy();
    const placeholders = [
      ...container.querySelectorAll('[data-slot="tier-placeholders"] [data-num]'),
    ];
    expect(placeholders.map((p) => p.textContent)).toEqual(["{{PARAM}}", "{{PARAM}}", "{{PARAM}}"]);
    expect(screen.getByRole("slider").getAttribute("data-disabled")).toBe("");
    const cta = screen.getByRole("button", { name: "Chip in {{PARAM}}" });
    expect(cta.hasAttribute("disabled")).toBe(true);
    // §5 table carries placeholders too — no fallback prices anywhere
    expect(container.textContent).toContain("up to {{PARAM}}");
    // §7: no subaccord until the chain answers — {{PARAM}}, never a link
    expect(container.textContent).toContain("ADJUDICATION · SUBACCORD {{PARAM}}");
    expect(container.querySelector('[data-slot="policy-section"] a')).toBeNull();
  });
});

describe("cluster unreachable — retry state", () => {
  it("says 'Couldn't reach the cluster.' with a Try again button", async () => {
    fetchMock.mockRejectedValue(new Error("socket hang up"));
    renderPoolPage();
    expect(
      await screen.findByText("Couldn't reach the cluster.", {}, { timeout: 5000 }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});

describe("mutual absent on the cluster — switch-cluster empty state", () => {
  it("states 'Not live on this cluster' with an inline ClusterSelect and no tier numbers", async () => {
    fetchMock.mockResolvedValue(NOT_FOUND);
    const { container } = renderPoolPage();
    expect(await screen.findByText("Not live on this cluster")).toBeTruthy();
    expect(
      screen.getByText(
        "The Blade Pool isn't deployed on this network. Switch networks to find it.",
      ),
    ).toBeTruthy();
    expect(screen.getByRole("combobox")).toBeTruthy();
    // no fallback tiers, no chip-in
    expect(screen.queryByText(/entry · up to/)).toBeNull();
    expect(screen.queryByRole("button", { name: /Chip in/ })).toBeNull();
    expect(container.textContent).toContain("up to {{PARAM}}");
  });

  it("clusters without a configured deployment skip the fetch entirely", () => {
    renderPoolPage("");
    expect(screen.getByText("Not live on this cluster")).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("deposits closed — entry-closed state from deposits_close_at", () => {
  it("states 'Entry closed.' and drops the chip-in CTA", async () => {
    fetchMock.mockResolvedValue(
      maybe(fakeMutual({ depositsCloseAt: BigInt(Date.UTC(2026, 0, 15) / 1000) })),
    );
    renderPoolPage();
    expect(await screen.findByText("Entry closed.")).toBeTruthy();
    expect(
      screen.getByText(
        "This pool stopped taking members. Claims, settlement, and dissolution follow the policy.",
      ),
    ).toBeTruthy();
    // tiers still render (real chain data), but there is nothing to chip into
    expect(
      await screen.findByText("Standard · $20 entry · up to $2,000 maximum payout"),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Chip in/ })).toBeNull();
  });
});
