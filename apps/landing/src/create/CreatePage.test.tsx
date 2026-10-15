// CreatePage — the #/create wizard's author+preview smoke lane and the
// deploy/publish/verify machine (the exhaustive state matrix is the test
// bean's; here: the mount, the field bindings, the Continue gate, the
// preview anchors, the draft resume, and the deploy-half states). Copy
// verbatim from meta/marketing/03-website-copy/landing-page.md § /create.

import { fetchMaybeMutualBySeed, getInitializeMutualInstructionAsync } from "@riprap/hanse";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendInstruction } from "../shared/transaction";
import { CreatePage } from "./CreatePage";

const { walletState } = vi.hoisted(() => ({
  walletState: { isConnected: false, account: null as string | null },
}));

vi.mock("@riprap/hanse", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@riprap/hanse")>();
  return {
    ...actual,
    fetchMaybeMutualBySeed: vi.fn(async () => null),
    getInitializeMutualInstructionAsync: vi.fn(async () => ({})),
  };
});
vi.mock("@solana/connector", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@solana/connector")>();
  return {
    ...actual,
    useWallet: () => walletState,
    useKitTransactionSigner: () => ({ signer: null }),
    useCluster: () => ({ clusters: [], cluster: null, setCluster: vi.fn() }),
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

beforeEach(() => {
  seedMock.mockClear();
  initMock.mockClear();
  sendMock.mockClear();
  walletState.isConnected = false;
  walletState.account = null;
  localStorage.clear();
  vi.unstubAllGlobals();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("#/create author → preview", () => {
  /** The Continue button's disabled flag (no jest-dom in the house style). */
  const continueDisabled = () =>
    (screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled;
  const inputValue = (id: string) => (document.getElementById(id) as HTMLInputElement).value;

  it("mounts on the author step with the copy-doc frame", async () => {
    renderPage();
    expect(await screen.findByRole("heading", { name: "Create a pool" })).toBeTruthy();
    expect(screen.getByText("Author → Preview → Deploy → Publish → Verify")).toBeTruthy();
    expect(document.getElementById("def-name")).toBeTruthy();
    expect(document.getElementById("def-definition")).toBeTruthy();
    expect(continueDisabled()).toBe(true);
  });

  it("derives the slug from the name and gates Continue until the form passes", async () => {
    renderPage();
    fill("def-name", "Chairmageddon");
    await waitFor(() => expect(inputValue("def-slug")).toBe("chairmageddon"));
    // still incomplete: definition, exclusions, tier numbers, window, proof label
    expect(continueDisabled()).toBe(true);

    fill("def-definition", "Bodily injury from standing through the opening ceremony.");
    fill("def-exclusions", "injuries you caused yourself");
    fill("tier-0-fee", "10");
    fill("tier-0-cap", "40");
    fill("period-start", "2027-03-01");
    fill("period-end", "2027-03-03");
    fill("period-claims", "2027-03-10");
    fill("proof-0-label", "your event ticket");
    await waitFor(() => expect(continueDisabled()).toBe(false));
  });

  it("preview shows the exact bytes and their anchors (mono), then Back returns", async () => {
    renderPage();
    fill("def-name", "Chairmageddon");
    fill("def-definition", "Bodily injury from standing through the opening ceremony.");
    fill("def-exclusions", "injuries you caused yourself");
    fill("tier-0-fee", "10");
    fill("tier-0-cap", "40");
    fill("period-start", "2027-03-01");
    fill("period-end", "2027-03-03");
    fill("period-claims", "2027-03-10");
    fill("proof-0-label", "your event ticket");
    fireEvent.click(await screen.findByRole("button", { name: "Continue" }));

    expect(await screen.findByText(/One document is the pool's law/)).toBeTruthy();
    // the exact bytes, mono: the frontmatter head renders verbatim
    expect(screen.getAllByText(/schema: riprap-def\/v1/).length).toBeGreaterThan(0);
    expect(screen.getByText(/^sha256 [0-9a-f]{64}$/)).toBeTruthy();
    expect(screen.getByText(/^domain ref [0-9a-f]{64}$/)).toBeTruthy();
    expect(screen.getByText(/^seed \d+$/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    await waitFor(() => expect(inputValue("def-name")).toBe("Chairmageddon"));
  });

  it("the draft resumes across a reload (localStorage fields only)", async () => {
    renderPage();
    fill("def-name", "Chairmageddon");
    fill("def-definition", "Bodily injury from standing through the opening ceremony.");
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem("riprap:create") ?? "{}").def.name).toBe(
        "Chairmageddon",
      ),
    );
    cleanup();
    renderPage();
    await waitFor(() => expect(inputValue("def-name")).toBe("Chairmageddon"));
    expect(inputValue("def-definition")).toBe(
      "Bodily injury from standing through the opening ceremony.",
    );
  });
});

// ─── DEPLOY / PUBLISH / VERIFY ──────────────────────────────────────────────

describe("#/create deploy → publish → verify", () => {
  const WALLET = "BXGcC19c43fzU3JyowyJrTVQ7gahtGR9o2Ca1JKSGKbe"; // 44-char valid Address (PDA derivations assert it)
  const MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

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

  /** Fill the valid author form (wallet connected, daemon stubbed first). */
  async function fillValidForm() {
    renderPage();
    fill("def-name", "Chairmageddon");
    fill("def-definition", "Bodily injury from standing through the opening ceremony.");
    fill("def-exclusions", "injuries you caused yourself");
    fill("tier-0-fee", "10");
    fill("tier-0-cap", "40");
    fill("period-start", "2027-03-01");
    fill("period-end", "2027-03-03");
    fill("period-claims", "2027-03-10");
    fill("proof-0-label", "your event ticket");
  }

  /** The drawer path: open it, set the mint, close it — the mint is the
   * one advanced value the walk must author through the UI. */
  async function setMintThroughDrawer() {
    fireEvent.click(screen.getByRole("button", { name: /Advanced pool settings/ }));
    const mint = await waitFor(() => {
      const input = document.getElementById("adv-mint") as HTMLInputElement | null;
      if (input === null) throw new Error("drawer not open yet");
      return input;
    });
    fireEvent.change(mint, { target: { value: MINT } });
    // close the sheet — its modal hides the author form from a11y queries
    fireEvent.keyDown(document.activeElement ?? document, { key: "Escape" });
  }

  /** Preview → deploy, waiting for the async anchors to unblock the button. */
  async function continueToDeploy() {
    const deployButton = await screen.findByRole("button", { name: "Continue to deploy" });
    await waitFor(() => {
      if ((deployButton as HTMLButtonElement).disabled) throw new Error("anchors not landed");
    });
    fireEvent.click(deployButton);
  }

  /** Walk to the publish step: valid form → mint via drawer → preview →
   * deploy → confirmed. */
  async function walkToPublish(daemon: () => unknown = stubFaithfulDaemon) {
    walletState.isConnected = true;
    walletState.account = WALLET;
    daemon();
    await fillValidForm();
    await setMintThroughDrawer();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await continueToDeploy();
    await screen.findByText(/Your wallet pays the rent/);
    fireEvent.click(screen.getByRole("button", { name: "Deploy the pool" }));
    await screen.findByText(/The pool is live/);
  }

  it("blocks deploy on the mirrored drawer gates (mint missing → the gate line)", async () => {
    walletState.isConnected = true;
    walletState.account = WALLET;
    stubFaithfulDaemon();
    await fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await continueToDeploy();
    expect(
      await screen.findByText("A mint pubkey — classic SPL Token, no Token-2022."),
    ).toBeTruthy();
    expect(screen.getByText("Fix it in the advanced drawer.")).toBeTruthy();
  });

  it("gates on the wallet: no wallet, no deploy", async () => {
    stubFaithfulDaemon();
    await fillValidForm();
    // mint through the draft (the drawer path is covered above)
    const draft = JSON.parse(localStorage.getItem("riprap:create") ?? "{}");
    draft.advanced.mint = MINT;
    localStorage.setItem("riprap:create", JSON.stringify(draft));
    cleanup();
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Continue" }));
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
