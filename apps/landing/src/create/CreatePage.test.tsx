// CreatePage — the #/create wizard's six-screen author walk and the
// deploy/publish/verify machine (the exhaustive state matrix is the test
// bean's; here: the mount, the per-screen gates, the strip's jumps, the
// preview anchors, the draft resume landing, and the deploy-half states).
// Copy verbatim from meta/marketing/03-website-copy/landing-page.md § /create.

import { fetchMaybeMutualBySeed, getInitializeMutualInstructionAsync } from "@riprap/hanse";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendInstruction } from "../shared/transaction";
import { CreatePage } from "./CreatePage";
import { emptyDraft, saveDraft } from "./draft";

const { walletState, clusterState } = vi.hoisted(() => ({
  walletState: { isConnected: false, account: null as string | null },
  clusterState: { cluster: null as { id: string } | null },
}));

vi.mock("@riprap/hanse", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@riprap/hanse")>();
  return {
    ...actual,
    fetchMaybeMutualBySeed: vi.fn<() => Promise<unknown>>(async () => null),
    getInitializeMutualInstructionAsync: vi.fn(async () => ({})),
  };
});
vi.mock("@solana/connector", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@solana/connector")>();
  return {
    ...actual,
    useWallet: () => walletState,
    useKitTransactionSigner: () => ({ signer: null }),
    useCluster: () => ({ clusters: [], cluster: clusterState.cluster, setCluster: vi.fn() }),
    useWalletConnectors: () => [],
    useConnectWallet: () => ({ connect: vi.fn() }),
    useDisconnectWallet: () => ({ disconnect: vi.fn() }),
  };
});
vi.mock("../shared/rpc", () => ({
  useClusterRpc: () => ({
    endpoint: "http://127.0.0.1:8899",
    rpc: {},
    rpcSubscriptions: {},
  }),
  useHanseEnv: () => ({
    endpoint: "http://127.0.0.1:8899",
    rpc: {},
    rpcSubscriptions: {},
    signer: { address: walletState.account, signTransactions: vi.fn() },
  }),
}));
vi.mock("../shared/transaction", () => ({
  sendInstruction: vi.fn(async () => "SIGSIGSIGSIGSIGSIGSIGSIGSIGSIGSIGSIGSIGSIGSIGSIGSIGSIG"),
  describeError: (err: unknown) => (err instanceof Error ? err.message : "send failed"),
}));
vi.mock("../pool/evidenceServer", () => ({
  useClusterEvidenceOperator: () => "",
  useEvidenceDaemonUrl: () => "https://daemon.test",
}));

const seedMock = vi.mocked(fetchMaybeMutualBySeed);
const initMock = vi.mocked(getInitializeMutualInstructionAsync);
const sendMock = vi.mocked(sendInstruction);

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <CreatePage />
    </QueryClientProvider>,
  );
}

/** Fill by input id — Field ids are stable and unique (labels repeat across
 * tiers and marketing fields). */
function fill(id: string, value: string) {
  const input = document.getElementById(id);
  if (input === null) throw new Error(`no input #${id}`);
  fireEvent.change(input, { target: { value } });
}

/** The authoring screen's own form — submitting it is the Enter path. */
function authorForm() {
  const form = document.querySelector('[data-slot="author-form"]');
  if (!(form instanceof HTMLFormElement)) throw new Error("no author-form");
  return form;
}

/** Submit the current authoring screen (the Continue button is a submit). */
function stepContinue() {
  fireEvent.submit(authorForm());
}

/** Wait until an authoring screen shows one of its inputs. */
async function atStep(id: string) {
  await waitFor(() => {
    if (document.getElementById(id) === null) throw new Error(`#${id} not on screen`);
  });
}

/** Fill the valid form across the authoring screens — one question per
 * screen — ending on ADVANCED (the mint sits there, prefilled with USDC).
 * `stopAt: "marketing"` ends one screen earlier, on the preview-riding
 * marketing screen. */
async function walkValidForm(stopAt?: "marketing") {
  fill("def-name", "Chairmageddon");
  stepContinue();
  await atStep("tier-0-fee");
  fill("tier-0-fee", "10");
  fill("tier-0-cap", "40");
  stepContinue();
  await atStep("period-start");
  fill("period-start", "2027-03-01");
  fill("period-end", "2027-03-03");
  fill("period-claims", "2027-03-10");
  stepContinue();
  await atStep("def-definition");
  fill("def-definition", "Bodily injury from standing through the opening ceremony.");
  fill("proof-0-label", "your event ticket");
  stepContinue();
  await atStep("marketing-headline");
  if (stopAt === "marketing") return;
  stepContinue();
  await atStep("adv-mint");
}

beforeEach(() => {
  seedMock.mockClear();
  initMock.mockClear();
  sendMock.mockClear();
  walletState.isConnected = false;
  walletState.account = null;
  clusterState.cluster = null;
  localStorage.clear();
  vi.unstubAllGlobals();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("#/create author → preview", () => {
  const inputValue = (id: string) => (document.getElementById(id) as HTMLInputElement).value;
  const currentStep = () =>
    document.querySelector('[data-slot="wizard-progress"] [aria-current="step"]')?.textContent;
  const stop = (name: string) => screen.getByRole("button", { name }) as HTMLButtonElement;

  it("mounts on the identity screen as a form with the copy-doc frame", async () => {
    renderPage();
    expect(await screen.findByRole("heading", { name: "Create a pool" })).toBeTruthy();
    // one live progress display: phase row, counter, track (copy doc §
    // /create Progress strip — the hero rail and author rail are retired)
    expect(document.querySelector('[data-slot="wizard-progress"]')).toBeTruthy();
    expect(screen.getByText("01/10")).toBeTruthy();
    expect(currentStep()).toContain("Author");
    // the step change is announced in an sr-only polite region; the visible
    // counter is decoration
    expect(document.querySelector('[aria-live="polite"]')?.textContent).toBe(
      "Step 1 of 10: Identity",
    );
    expect(document.getElementById("def-name")).toBeTruthy();
    // one question per screen: the claims prose waits on its own screen
    expect(document.getElementById("def-definition")).toBeNull();
    // every authoring screen is a form with a footer that sticks to the
    // viewport bottom while the screen scrolls
    expect(document.querySelector('[data-slot="author-form"]')).toBeTruthy();
    expect(document.querySelector('[data-slot="author-nav"]')?.className).toContain("sticky");
    // Continue is never disabled — a blocked submit refuses and moves focus
    // instead (a dead button explains nothing)
    expect(stop("Continue").disabled).toBe(false);
  });

  it("refuses a blocked submit on the spot, focusing the gate-carrying field", async () => {
    renderPage();
    // nothing typed: the submit stays put and puts focus on the field whose
    // own gate line already sits under it
    stepContinue();
    expect(document.getElementById("def-name")).toBeTruthy();
    expect(document.activeElement?.id).toBe("def-name");
    expect(screen.getByText("The pool needs a name.")).toBeTruthy();
    // the same refusal on the next screen, on that screen's own field
    fill("def-name", "Chairmageddon");
    stepContinue();
    await atStep("tier-0-fee");
    stepContinue();
    expect(document.getElementById("tier-0-fee")).toBeTruthy();
    expect(document.activeElement?.id).toBe("tier-0-fee");
  });

  it("walks the six screens one question at a time, deriving the slug on the way", async () => {
    renderPage();
    fill("def-name", "Chairmageddon");
    await waitFor(() => expect(inputValue("def-slug")).toBe("chairmageddon"));
    stepContinue();
    await atStep("tier-0-fee");
    // a fresh screen takes focus at its heading
    expect(document.activeElement?.textContent).toContain("Tiers");
    fill("tier-0-fee", "10");
    fill("tier-0-cap", "40");
    stepContinue();
    await atStep("period-start");
    fill("period-start", "2027-03-01");
    fill("period-end", "2027-03-03");
    fill("period-claims", "2027-03-10");
    stepContinue();
    await atStep("def-definition");
    fill("def-definition", "Bodily injury from standing through the opening ceremony.");
    fill("proof-0-label", "your event ticket");
    stepContinue();
    await atStep("marketing-headline");
    stepContinue(); // nothing required here — straight through
    await atStep("adv-mint");
    expect(screen.getByText("06/10")).toBeTruthy(); // the strip counts author screens
  });

  it("the strip jumps to any author screen and the preview — never to deploy", async () => {
    renderPage();
    stop("Step 4 of 10: Claims").click();
    await atStep("def-definition");
    expect(document.getElementById("def-name")).toBeNull();
    // back home through the same control, and the draft walks with it
    stop("Step 1 of 10: Identity").click();
    await atStep("def-name");
    expect(inputValue("def-name")).toBe("");
    fill("def-name", "Chairmageddon");
    stop("Step 7 of 10: Preview").click();
    await screen.findByText(/One document is the pool's law/);
    expect(currentStep()).toContain("Preview");
    // the chain phases cannot be jumped into: deploy never, publish/verify
    // not before the record is frozen — author screens stay walkable
    expect(stop("Step 8 of 10: Deploy").disabled).toBe(true);
    expect(stop("Step 9 of 10: Publish").disabled).toBe(true);
    expect(stop("Step 10 of 10: Verify").disabled).toBe(true);
    expect(stop("Step 5 of 10: Marketing").disabled).toBe(false);
  });

  it("the preview refuses an unfinished draft with the blocking line and its fix", async () => {
    renderPage();
    stop("Step 7 of 10: Preview").click();
    await screen.findByText(/One document is the pool's law/);
    // the first screen that still rejects names itself
    expect(screen.getByText("The pool needs a name.")).toBeTruthy();
    expect(stop("Continue to deploy").disabled).toBe(true);
    // the fix button is the jump — same as the strip, one click to the screen
    stop("Fix it in the identity step.").click();
    await atStep("def-name");
  });

  it("opens the deploy gate once every screen's gates pass", async () => {
    renderPage();
    await walkValidForm();
    stepContinue();
    await screen.findByText(/One document is the pool's law/);
    // no blocking line, deploy open
    expect(document.querySelector('[data-slot="preview-blocked"]')).toBeNull();
    expect(stop("Continue to deploy").disabled).toBe(false);
  });

  it("the marketing screen rides a scaled pool-page preview", async () => {
    renderPage();
    await walkValidForm("marketing");
    const panel = await waitFor(() => {
      const node = document.querySelector<HTMLElement>('[data-slot="marketing-preview"]');
      if (node === null) throw new Error("preview not mounted");
      return node;
    });
    expect(panel.textContent).toContain("The pool page — preview at 70%");
    // kind default fills the headline until the author writes one
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "One peril. One pool. It ends.",
      }),
    ).toBeTruthy();
    fill("marketing-headline", "Standing room only.");
    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 2, name: "Standing room only." })).toBeTruthy(),
    );
    // the logo field drives the preview's framed image
    fill("marketing-logo", "https://riprap.xyz/pools/chairmageddon/logo.svg");
    const logo = await waitFor(() => {
      const img = panel.querySelector('[data-slot="pool-logo"]');
      if (img === null) throw new Error("logo not in preview yet");
      return img;
    });
    expect(logo.getAttribute("src")).toBe("https://riprap.xyz/pools/chairmageddon/logo.svg");
    // the join column is a stand-in — the join machine needs a deployed pool
    expect(panel.textContent).toContain("The join controls land here when the pool deploys.");
  });

  it("preview shows the exact bytes and their anchors (mono), then Back walks home", async () => {
    renderPage();
    await walkValidForm();
    stepContinue(); // advanced → preview
    expect(await screen.findByText(/One document is the pool's law/)).toBeTruthy();
    expect(screen.getByText("07/10")).toBeTruthy(); // the strip crosses into the chain phases
    expect(currentStep()).toContain("Preview");
    // the exact bytes, mono: the frontmatter head renders verbatim
    expect(screen.getAllByText(/schema: riprap-def\/v1/).length).toBeGreaterThan(0);
    expect(screen.getByText(/^sha256 [0-9a-f]{64}$/)).toBeTruthy();
    expect(screen.getByText(/^domain ref [0-9a-f]{64}$/)).toBeTruthy();
    expect(screen.getByText(/^seed \d+$/)).toBeTruthy();
    // Back returns to the last authoring screen, then walks home with the draft
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    await atStep("adv-mint");
    for (let i = 0; i < 5; i += 1) {
      fireEvent.click(screen.getByRole("button", { name: "Back" }));
    }
    await atStep("def-name");
    expect(inputValue("def-name")).toBe("Chairmageddon");
  });

  it("the draft resumes across a reload, at the first screen with work left", async () => {
    renderPage();
    fill("def-name", "Chairmageddon");
    stepContinue();
    await atStep("tier-0-fee");
    fill("tier-0-fee", "10");
    fill("tier-0-cap", "40");
    stepContinue();
    await atStep("period-start");
    fill("period-start", "2027-03-01");
    fill("period-end", "2027-03-03");
    fill("period-claims", "2027-03-10");
    stepContinue();
    await atStep("def-definition");
    fill("def-definition", "Bodily injury from standing through the opening ceremony.");
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem("riprap:create") ?? "{}").def.name).toBe(
        "Chairmageddon",
      ),
    );
    cleanup();
    renderPage();
    // the proof slot is the remaining work — the wizard reopens on CLAIMS
    await atStep("def-definition");
    expect(inputValue("def-definition")).toBe(
      "Bodily injury from standing through the opening ceremony.",
    );
    expect(document.getElementById("proof-0-label")).toBeTruthy();
    expect(document.getElementById("def-name")).toBeNull();
  });

  it("the mint prefill follows the connected cluster — a mainnet draft resumed on devnet gets devnet USDC", async () => {
    // Devnet USDC (SETUP.BLADE-POOL.md §4.2 example) — the deploy simulates
    // AccountOwnedByWrongProgram on deposit_mint with the mainnet prefill.
    const DEVNET_USDC = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
    clusterState.cluster = { id: "solana:devnet" };
    const saved = emptyDraft();
    saved.advanced.mint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"; // the mainnet prefill
    saveDraft(saved);
    renderPage();
    await walkValidForm();
    await waitFor(() => expect(inputValue("adv-mint")).toBe(DEVNET_USDC));
  });
});

// ─── DEPLOY / PUBLISH / VERIFY ──────────────────────────────────────────────

describe("#/create deploy → publish → verify", () => {
  const WALLET = "BXGcC19c43fzU3JyowyJrTVQ7gahtGR9o2Ca1JKSGKbe"; // 44-char valid Address (PDA derivations assert it)
  const MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"; // also the USDC default the screen prefills
  const inputValue = (id: string) => (document.getElementById(id) as HTMLInputElement).value;

  /** A faithful daemon: PUT 200s (capturing the body); GET returns the
   * captured bytes — the round-trip the verify step asserts. */
  function stubFaithfulDaemon() {
    const state = { putBody: "" };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.method === "PUT") {
          state.putBody = init.body instanceof Blob ? await init.body.text() : String(init.body);
          return new Response(null, { status: 200 });
        }
        void input;
        return new Response(state.putBody, { status: 200 });
      }),
    );
    return state;
  }

  /** Preview → deploy, waiting for the async anchors to unblock the button. */
  async function continueToDeploy() {
    const deployButton = await screen.findByRole("button", {
      name: "Continue to deploy",
    });
    await waitFor(() => {
      if ((deployButton as HTMLButtonElement).disabled) throw new Error("anchors not landed");
    });
    fireEvent.click(deployButton);
  }

  /** Walk to the publish step: valid form across the six screens → mint on
   * the advanced screen → preview → deploy → confirmed. */
  async function walkToPublish(daemon: () => unknown = stubFaithfulDaemon) {
    walletState.isConnected = true;
    walletState.account = WALLET;
    daemon();
    renderPage();
    await walkValidForm();
    fill("adv-mint", MINT);
    stepContinue();
    await continueToDeploy();
    await screen.findByText(/Your wallet pays the rent/);
    fireEvent.click(screen.getByRole("button", { name: "Deploy the pool" }));
    await screen.findByText(/The pool is live/);
  }

  it("prefills USDC and gates the advanced screen when the mint is cleared", async () => {
    walletState.isConnected = true;
    walletState.account = WALLET;
    stubFaithfulDaemon();
    renderPage();
    await walkValidForm();
    expect(inputValue("adv-mint")).toBe(MINT);
    // clear the prefilled USDC to trip the gate on its own screen
    fill("adv-mint", "");
    stepContinue();
    expect(document.getElementById("adv-mint")).toBeTruthy();
    expect(document.activeElement?.id).toBe("adv-mint");
    expect(
      await screen.findByText("A mint pubkey — classic SPL Token, no Token-2022."),
    ).toBeTruthy();
  });

  it("gates on the wallet: no wallet, no deploy", async () => {
    stubFaithfulDaemon();
    renderPage();
    await walkValidForm();
    // mint through the draft (the advanced-screen path is covered above)
    const draft = JSON.parse(localStorage.getItem("riprap:create") ?? "{}");
    draft.advanced.mint = MINT;
    localStorage.setItem("riprap:create", JSON.stringify(draft));
    cleanup();
    renderPage();
    // every gate clean — the resumed draft lands on the advanced screen
    await atStep("adv-mint");
    stepContinue();
    await continueToDeploy();
    expect(
      await screen.findByText(
        "Deploying needs a wallet — the pool is created by one signature from it.",
      ),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Connect a wallet" })).toBeTruthy();
  });

  it("deploys one initialize_mutual (derived args), clears the draft, advances to publish", async () => {
    await walkToPublish();
    expect(initMock).toHaveBeenCalledTimes(1);
    const args = initMock.mock.calls[0]?.[0];
    if (args === undefined) throw new Error("initialize_mutual never built");
    expect(args.tiers).toHaveLength(3); // 1-tier def padded to the on-chain [Tier; 3]
    expect(args.tiers[0]?.contribution).toBe(10_000_000n);
    expect(args.tiers[0]?.maxPayout).toBe(40_000_000n);
    expect(args.subaccordArg.evidenceOperator).toBe(WALLET); // empty field → creator
    expect(args.depositsCloseAt).toBe(BigInt(Date.parse("2027-03-01T00:00:00Z") / 1000));
    expect(sendMock).toHaveBeenCalledTimes(1);
    // the draft cleared the moment the deploy confirmed (storage gone or
    // blank — the wizard re-saves a blank draft only on Done)
    await waitFor(() => {
      const raw = localStorage.getItem("riprap:create");
      expect(raw === null || JSON.parse(raw).def.name === "").toBe(true);
    });
  });

  it("publishes the exact bytes at the derived ref, then verifies the round-trip", async () => {
    await walkToPublish();
    fireEvent.click(screen.getByRole("button", { name: "Publish the document" }));
    expect(await screen.findByText("The document reads back exact.")).toBeTruthy();
    const calls = vi.mocked(fetch).mock.calls;
    const put = calls.find(([, init]) => init?.method === "PUT");
    const url = String(put?.[0]);
    expect(url).toMatch(/^https:\/\/daemon\.test\/domains\/[0-9a-f]{64}\?/);
    expect(url).toContain("subaccord=");
    expect(url).toContain("preimage=");
    expect(screen.getByRole("link", { name: /Open the pool page/ })).toBeTruthy();
  });

  it("a 409 stops with the deadpan conflict line; Publish later advances to verify", async () => {
    await walkToPublish(() => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) =>
          init?.method === "PUT"
            ? new Response(null, { status: 409 })
            : new Response("", { status: 200 }),
        ),
      );
    });
    fireEvent.click(screen.getByRole("button", { name: "Publish the document" }));
    expect(
      await screen.findByText(
        "Different bytes are already stored at this address — nothing was overwritten.",
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Publish later" }));
    await screen.findByText(/Reading the document back|doesn't match/);
  });
});

// ─── the tester-matrix: mapped gate lines, publish states, seed re-pick ────

describe("#/create gate + state matrix", () => {
  const MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
  const WALLET = "BXGcC19c43fzU3JyowyJrTVQ7gahtGR9o2Ca1JKSGKbe";

  /** Fill one advanced field with a value (the advanced screen must be
   * current — walk there first). */
  async function setAdvanced(id: string, value: string) {
    const input = await waitFor(() => {
      const node = document.getElementById(id) as HTMLInputElement | null;
      if (node === null) throw new Error(`#${id} not on screen`);
      return node;
    });
    fireEvent.change(input, { target: { value } });
  }

  it("maps every advanced gate to its one line, under its own field", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 200 })),
    );
    renderPage();
    await walkValidForm();
    await setAdvanced("adv-jury", "4"); // even → odd gate
    expect(await screen.findByText("Must be odd.")).toBeTruthy();
    await setAdvanced("adv-appeals", "4"); // above the accord bound → ladder
    expect(await screen.findByText("The appeal ladder must fit 31 jurors.")).toBeTruthy();
    await setAdvanced("adv-alpha", "10001");
    expect(screen.getAllByText("0–10000.").length).toBeGreaterThanOrEqual(1);
    await setAdvanced("adv-reveal-bps", "10001");
    expect(screen.getAllByText("0–10000.").length).toBeGreaterThanOrEqual(2);
    await setAdvanced("adv-commit", "0");
    expect(await screen.findByText("Windows must be above zero.")).toBeTruthy();
    await setAdvanced("adv-appeal", "0.5");
    expect(await screen.findByText("At least 1 hour.")).toBeTruthy();
    await setAdvanced("adv-draws", "11");
    expect(await screen.findByText("1–10.")).toBeTruthy();
    // the evidence operator field is gone — the cluster's configured
    // operator (else the creator) rides the derived rows instead
    expect(document.getElementById("adv-operator")).toBeNull();
    expect(
      await screen.findByText(/evidence operator (the creator's wallet|\S{32,44})/),
    ).toBeTruthy();
  });

  it("publish states: 400 rejected, 404 mutual-not-visible — each its deadpan line", async () => {
    for (const [status, line] of [
      [400, "The daemon rejected the document."],
      [404, "The daemon can't see the mutual yet. Try again in a moment."],
    ] as const) {
      cleanup(); // one tree per iteration
      walletState.isConnected = true;
      walletState.account = WALLET;
      vi.stubGlobal(
        "fetch",
        vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) =>
          init?.method === "PUT"
            ? new Response(null, { status })
            : new Response("", { status: 200 }),
        ),
      );
      renderPage();
      await walkValidForm();
      fill("adv-mint", MINT);
      stepContinue();
      const deployButton = await screen.findByRole("button", {
        name: "Continue to deploy",
      });
      await waitFor(() => {
        if ((deployButton as HTMLButtonElement).disabled) throw new Error("anchors pending");
      });
      fireEvent.click(deployButton);
      fireEvent.click(await screen.findByRole("button", { name: "Deploy the pool" }));
      const publish = await screen.findByRole(
        "button",
        { name: "Publish the document" },
        { timeout: 5000 },
      );
      fireEvent.click(publish);
      expect(await screen.findByText(line)).toBeTruthy();
      localStorage.clear();
    }
  });

  it("re-picks the seed while its mutual address is taken, and says so on the preview", async () => {
    // an existing mutual answers every seed query — cast to the SDK shape
    // (content irrelevant: the wizard only checks existence)
    const taken = {
      exists: true,
      address: "A".repeat(32),
      data: {},
    } as unknown as Parameters<typeof seedMock.mockResolvedValue>[0];
    seedMock.mockResolvedValue(taken);
    renderPage();
    await waitFor(() => expect(seedMock.mock.calls.length).toBeGreaterThanOrEqual(2));
    await walkValidForm();
    stepContinue();
    expect(
      await screen.findByText(/This seed's address is taken — go back and the wizard re-picks/),
    ).toBeTruthy();
  });
});
