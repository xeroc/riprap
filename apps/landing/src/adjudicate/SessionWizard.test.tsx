// SessionWizard suite (riprap-cqif): the composed lock-step session
// (ADJUDICATION-DASHBOARD §4, HANDOFF §6) — gating order (unverified
// evidence blocks the documents; an unanswered checklist blocks the
// verdict; an unmade verdict blocks commit), back-nav free at any time,
// §8 persistence keyed (mutual, dispute, round) surviving a reload, the
// salt-bridge restore across sessions, the no-persist law for decrypted
// bytes, and the terminal do-not-vote state. The step components' own
// suites carry their unit contracts; this one proves the machine.
import type { Address } from "@solana/kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NO_VOTE, type Round } from "@useaccord/sdk";
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { type DocumentSlot, documentsAnswersKey } from "./DocumentsStep";
import { policyAnswersKey } from "./PolicyStep";
import { BLADE_POOL_POLICY } from "./policies/blade-pool";
import { SessionWizard } from "./SessionWizard";
import { saltBridgeKey, saveStoredVote } from "./vote";

vi.mock("@useaccord/sdk", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@useaccord/sdk")>();
  return { ...actual, Accord: vi.fn() };
});
vi.mock("../shared/rpc", () => ({
  useHanseEnv: () => ({
    endpoint: "http://127.0.0.1:8899",
    rpc: {},
    rpcSubscriptions: {},
    signer: { address: WALLET },
  }),
}));
const { sendInstructionMock } = vi.hoisted(() => ({ sendInstructionMock: vi.fn() }));
vi.mock("../shared/transaction", () => ({
  describeError: (err: unknown) => (err instanceof Error ? err.message : String(err)),
  sendInstruction: sendInstructionMock,
}));

const MUTUAL = "M".repeat(43) as Address;
const SUBACCORD = "1".repeat(32) as Address;
const DISPUTE = "2".repeat(32) as Address;
const ROUND_PDA = "3".repeat(32) as Address;
const WALLET = "4".repeat(32) as Address;
const JUROR_B = "5".repeat(32) as Address;
const JUROR_C = "6".repeat(32) as Address;
const SALT = new Uint8Array(32).map((_, i) => i);
const MANIFEST_SHA = "a".repeat(64);

const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);

function slots(): DocumentSlot[] {
  return BLADE_POOL_POLICY.documentSlots.map((slot) => ({
    path: slot.path,
    label: slot.label,
    verify: slot.whatToVerify,
    bytes: PDF_BYTES,
  }));
}

function round(over: Partial<Round> = {}): Round {
  return {
    roundIdx: 0,
    jurorCount: 3,
    commitCount: 0,
    revealCount: 0,
    drawAttempt: 0,
    settled: 0,
    bump: 255,
    pad0: new Uint8Array(0),
    reviewEnd: 100n,
    commitEnd: 200n,
    revealEnd: 300n,
    result: NO_VOTE,
    dispute: DISPUTE,
    jurors: [WALLET, JUROR_B, JUROR_C],
    commits: [new Uint8Array(32), new Uint8Array(32), new Uint8Array(32)],
    seatPrefix: [],
    seatStake: [],
    reveals: [NO_VOTE, NO_VOTE, NO_VOTE],
    ...over,
  } as Round;
}

/** Seed a complete documents store for the five policy §7 slots. */
function seedDocuments(): void {
  const ticks: Record<string, { seen: boolean; legible: boolean; inSlot: boolean }> = {};
  for (const slot of BLADE_POOL_POLICY.documentSlots) {
    ticks[slot.path] = { seen: true, legible: true, inSlot: true };
  }
  localStorage.setItem(
    documentsAnswersKey(MUTUAL, DISPUTE, 0),
    JSON.stringify({ ticks, samePerson: true }),
  );
}

/** Seed a complete checklist store (all-unsure — the weakest admissible). */
function seedChecklist(): void {
  const answers: Record<string, string> = {};
  for (const q of [...BLADE_POOL_POLICY.coverageCriteria, ...BLADE_POOL_POLICY.exclusions]) {
    answers[q] = "unsure";
  }
  localStorage.setItem(policyAnswersKey(MUTUAL, DISPUTE, 0), JSON.stringify(answers));
}

function wizardProps(over: Partial<Parameters<typeof SessionWizard>[0]> = {}) {
  return {
    mutual: MUTUAL,
    subaccord: SUBACCORD,
    dispute: DISPUTE,
    roundAddress: ROUND_PDA,
    round: round(),
    wallet: WALLET,
    policy: BLADE_POOL_POLICY,
    verification: {
      state: "verified" as const,
      bytes: PDF_BYTES,
      manifest: {} as never,
      files: [],
    },
    manifestSha256: MANIFEST_SHA,
    slots: slots(),
    amountMicro: 2_000_000_000n,
    feeEarnedMicro: null,
    ruling: null,
    nowSec: 250n,
    onRetry: vi.fn(),
    onExit: vi.fn(),
    ...over,
  };
}

function renderWizard(over: Partial<Parameters<typeof SessionWizard>[0]> = {}): {
  onExit: Mock;
  rerenderWith: (over: Partial<Parameters<typeof SessionWizard>[0]>) => void;
} {
  const onExit = vi.fn();
  const props = wizardProps({ ...over, onExit });
  const view = render(
    <QueryClientProvider client={new QueryClient()}>
      <SessionWizard {...props} />
    </QueryClientProvider>,
  );
  return {
    onExit,
    rerenderWith: (next: Partial<Parameters<typeof SessionWizard>[0]>) => {
      view.rerender(
        <QueryClientProvider client={new QueryClient()}>
          <SessionWizard {...wizardProps({ ...next, onExit })} />
        </QueryClientProvider>,
      );
    },
  };
}

/** Click a Continue/choice control inside the current step. */
function advance(name: string): void {
  fireEvent.click(screen.getByRole("button", { name }));
}

beforeEach(() => {
  sendInstructionMock.mockReset();
  sendInstructionMock.mockImplementation(async (_rpc, _subs, _signer, _ixs, onSubmitted) => {
    onSubmitted?.();
    return "sig".repeat(11);
  });
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("SessionWizard — gating order (spec §4: forward only through the next complete step)", () => {
  it("unverified evidence blocks the documents: a pending package never opens step 1", () => {
    renderWizard({ verification: { state: "pending", reason: "round incomplete" } });
    expect(screen.getByText("The round's evidence isn't complete yet.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
    expect(document.querySelector('[data-slot="step-1"]')).toBeNull();
  });

  it("a failed package is the terminal do-not-vote; nothing renders past it", () => {
    renderWizard({ verification: { state: "failed", reason: "root mismatch" } });
    expect(screen.getByText("Do not vote.")).toBeTruthy();
    expect(document.querySelector('[data-slot="step-1"]')).toBeNull();
  });

  it("no delivery key is the honest terminal state (spec §5 — the founder's interface is pending)", () => {
    renderWizard({ verification: { state: "no-key" } });
    expect(screen.getByText("No delivery key in this browser.")).toBeTruthy();
  });

  it("an unanswered checklist blocks the verdict: an incomplete store lands on step 2, not 3", () => {
    seedDocuments();
    const partial: Record<string, string> = {};
    const all = [...BLADE_POOL_POLICY.coverageCriteria, ...BLADE_POOL_POLICY.exclusions];
    for (const q of all.slice(0, all.length - 1)) partial[q] = "yes";
    localStorage.setItem(policyAnswersKey(MUTUAL, DISPUTE, 0), JSON.stringify(partial));
    renderWizard();
    // first incomplete step: documents complete, checklist one blank.
    expect(document.querySelector('[data-slot="step-2"]')).toBeTruthy();
    expect(document.querySelector('[data-slot="step-3"]')).toBeNull();
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it("an unmade verdict blocks commit: choice made, the machine opens step 4 only after it", () => {
    seedDocuments();
    seedChecklist();
    renderWizard();
    expect(document.querySelector('[data-slot="step-3"]')).toBeTruthy();
    advance("Deny");
    expect(document.querySelector('[data-slot="step-4"]')).toBeTruthy();
    expect(screen.getByRole("button", { name: "Commit vote" })).toBeTruthy();
  });
});

describe("SessionWizard — back-nav free at any time (spec §4)", () => {
  it("walks back from the verdict to the checklist with persisted answers intact", () => {
    seedDocuments();
    seedChecklist();
    renderWizard();
    advance("Back"); // step 3 → 2
    expect(document.querySelector('[data-slot="step-2"]')).toBeTruthy();
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(
      false,
    ); // the persisted answers hold — no re-blanking
    advance("Back"); // step 2 → 1
    expect(document.querySelector('[data-slot="step-1"]')).toBeTruthy();
    advance("Back"); // step 1 → 0
    expect(document.querySelector('[data-slot="step-0"]')).toBeTruthy();
  });

  it("back at step 0 exits the session (back free — the board is behind it)", () => {
    const { onExit } = renderWizard();
    advance("Back"); // step 1 → 0 (documents unseeded: the mount lands there)
    expect(document.querySelector('[data-slot="step-0"]')).toBeTruthy();
    advance("Back"); // step 0 → exit
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});

describe("SessionWizard — §8 persistence keyed (mutual, dispute, round), surviving reload", () => {
  it("a reload lands on the first incomplete step: committed seat → reveal (HANDOFF §6)", () => {
    seedDocuments();
    seedChecklist();
    saveStoredVote(saltBridgeKey(DISPUTE, 0, WALLET), 1n, SALT);
    const committedRound = round({
      commitCount: 1,
      commits: [new Uint8Array(32).fill(1), new Uint8Array(32), new Uint8Array(32)],
      reveals: [NO_VOTE, 1n, 0n],
    });
    // mount #1 — fresh session, choice unmade → verdict; simulate the
    // juror having chosen in an earlier mount by seeding nothing more:
    // the machine must still land on the FIRST incomplete step (3).
    renderWizard({ round: committedRound });
    expect(document.querySelector('[data-slot="step-3"]')).toBeTruthy();
    cleanup();
    // mount #2 — "reload" after the verdict + commit happened elsewhere:
    // choice is session memory (lost on reload), so the machine re-lands
    // on the verdict — correct lock-step; the bridge still serves the
    // reveal once the choice is re-made and commit is observed.
    renderWizard({ round: committedRound });
    advance("Deny");
    expect(document.querySelector('[data-slot="step-4"]')).toBeTruthy();
    expect(screen.getByText("Vote committed.")).toBeTruthy(); // hasCommitted from the round
    advance("Continue");
    expect(document.querySelector('[data-slot="step-5"]')).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reveal vote" })).toBeTruthy(); // bridge restored
  });

  it("answers under a different round key do not leak across seats", () => {
    seedDocuments();
    seedChecklist();
    renderWizard({ round: round({ roundIdx: 1 }) });
    // the round-1 keys are empty → documents blank → step 1, Continue disabled
    expect(document.querySelector('[data-slot="step-1"]')).toBeTruthy();
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });
});

describe("SessionWizard — the no-persist law for decrypted bytes (§6/§8)", () => {
  it("walking the documents never persists evidence bytes or blob URLs", async () => {
    const { rerenderWith } = renderWizard();
    advance("Continue"); // step 0 → 1 (documents)
    expect(document.querySelector('[data-slot="step-1"]')).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText("01-ticket.pdf")).toBeTruthy();
    });
    for (const value of Object.values(localStorage)) {
      expect(value).not.toContain("blob:");
      expect(value).not.toContain("%PDF");
    }
    // only the whitelisted answer keys exist
    const storedKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key !== null && localStorage.getItem(key) !== null) storedKeys.push(key);
    }
    expect(storedKeys.length).toBeGreaterThan(0); // the documents answers DID persist
    for (const key of storedKeys) {
      expect(key.startsWith("riprap.adjudicate.")).toBe(true);
    }
    rerenderWith({});
  });
});

describe("SessionWizard — outcome closes the loop (§8 clear rides the outcome)", () => {
  it("a revealed seat reaches the outcome; the seat stores clear", async () => {
    seedDocuments();
    seedChecklist();
    saveStoredVote(saltBridgeKey(DISPUTE, 0, WALLET), 1n, SALT);
    const done = round({
      commits: [new Uint8Array(32).fill(1), new Uint8Array(32).fill(1), new Uint8Array(32).fill(1)],
      reveals: [1n, 1n, 0n],
      commitCount: 3,
      revealCount: 3,
    });
    renderWizard({ round: done, ruling: 1 });
    advance("Deny"); // step 3 → 4 (already committed) → walk forward
    advance("Continue"); // step 4 → 5 (already revealed)
    advance("Continue"); // step 5 → 6
    expect(document.querySelector('[data-slot="step-6"]')).toBeTruthy();
    expect(screen.getByText("Denied")).toBeTruthy();
    await waitFor(() => {
      expect(localStorage.getItem(documentsAnswersKey(MUTUAL, DISPUTE, 0))).toBeNull();
      expect(localStorage.getItem(policyAnswersKey(MUTUAL, DISPUTE, 0))).toBeNull();
      expect(localStorage.getItem(saltBridgeKey(DISPUTE, 0, WALLET))).toBeNull();
    });
  });
});
