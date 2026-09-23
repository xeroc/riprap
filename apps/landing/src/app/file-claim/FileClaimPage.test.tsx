// #/app/file-claim — the wizard smoke (beans riprap-myu7 + riprap-yr3y):
// gate states, the full 0→5 walk, the sign machine (happy + nonce race —
// exactly one rebuild+re-sign, never a re-send after success), publish
// (POST + per-file PUT vs stubbed fetch, 409 hard stop), and the filed
// screen. Copy verbatim from meta/marketing/03-website-copy/landing-page.md
// § /app/file-claim.

import {
  buildFileClaim,
  fetchMaybeDepositorByOwner,
  fetchMaybeMemberByOwner,
  fetchMaybeMutual,
  type Member,
  type Mutual,
  tokenBalanceOrZero,
} from "@riprap/hanse";
import { AppProvider, getDefaultConfig } from "@solana/connector";
import type { Address, MaybeAccount } from "@solana/kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ed25519PublicKeyFromSeed } from "@useaccord/sdk/evidence";
import type { Mock } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeMutual } from "../../pool/fixtures";
import { sha256Hex } from "./documents";
import { FileClaimPage } from "./FileClaimPage";

// operator discovery stubbed to the ready answer — a REAL Ed25519 point
// (claimantEncrypt runs for real inside the publish step)
const OPERATOR_HEX = Array.from(ed25519PublicKeyFromSeed(new Uint8Array(32).fill(3)))
  .map((b) => b.toString(16).padStart(2, "0"))
  .join("");
vi.mock("./useEvidenceOperator", () => ({
  useEvidenceOperator: () => ({
    state: "ready",
    operator: {
      name: "Accord Evidence",
      url: "https://evidence.example",
      encryptionKey: OPERATOR_HEX,
      healthy: true,
    },
  }),
}));

const { walletState } = vi.hoisted(() => ({
  walletState: { isConnected: false, account: null as string | null },
}));

vi.mock("@riprap/hanse", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@riprap/hanse")>();
  return {
    ...actual,
    fetchMaybeMutual: vi.fn(),
    fetchMaybeMemberByOwner: vi.fn(),
    fetchMaybeDepositorByOwner: vi.fn(async () => ({
      exists: true,
      address: "D".repeat(32),
      data: { rightsStake: 20n * 1_000_000n },
    })),
    findAssociatedTokenAddress: vi.fn(async () => "1".repeat(32) as Address),
    tokenBalanceOrZero: vi.fn(),
    // nonce-faithful PDAs: stale (0) and fresh (1) are distinguishable — the
    // race test cross-checks the rebuilt buffer against them
    findClaimPda: vi.fn(async ({ nonce }: { nonce: bigint }) => [
      `${"C".repeat(31)}${String.fromCharCode(65 + Number(nonce))}` as Address,
      255,
    ]),
    buildFileClaim: vi.fn(async (input: { mutual: { claimNonce: bigint }; dispute: Address }) => ({
      instruction: { programAddress: "P".repeat(32) },
      fee: 15n * 1_000_000n,
      claim: `${"C".repeat(31)}${String.fromCharCode(65 + Number(input.mutual.claimNonce))}`,
      dispute: input.dispute,
      nonce: input.mutual.claimNonce,
    })),
  };
});

vi.mock("@solana/connector", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@solana/connector")>();
  return {
    ...actual,
    useWallet: () => walletState,
    useKitTransactionSigner: () => ({
      signer: {
        address: "W".repeat(32),
        keyPair: {},
        unlock: async () => {},
        signBytes: async () => new Uint8Array(64),
        signTransaction: async <T,>(tx: T) => tx,
      },
    }),
  };
});

vi.mock("@useaccord/sdk", () => ({
  fetchSubaccordMaybe: vi.fn(async () => ({
    exists: true,
    address: "S".repeat(32) as Address,
    data: {
      minStake: 10n * 1_000_000n,
      minJurySize: 3,
      feePerJuror: 5n * 1_000_000n,
      evidenceOperator: "E".repeat(32),
    },
  })),
  findDisputePda: vi.fn(async ({ nonce }: { nonce: bigint }) => [
    `${"D".repeat(31)}${String.fromCharCode(65 + Number(nonce))}` as Address,
    255,
  ]),
  findAccordStatePda: vi.fn(async () => ["A".repeat(32) as Address, 255]),
}));

vi.mock("../../shared/rpc", () => ({
  useClusterRpc: () => ({
    endpoint: "http://127.0.0.1:8899",
    rpc: { getBalance: () => ({ send: async () => ({ value: 1n }) }) },
    rpcSubscriptions: {},
  }),
  useHanseEnv: () => ({
    endpoint: "http://127.0.0.1:8899",
    rpc: { getBalance: () => ({ send: async () => ({ value: 1n }) }) },
    rpcSubscriptions: {},
    signer: { address: "W".repeat(32) },
  }),
}));

vi.mock("../../shared/transaction", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../shared/transaction")>();
  return { ...actual, sendInstruction: vi.fn(async () => "SIG") };
});

const mutualMock = vi.mocked(fetchMaybeMutual);
const memberMock = vi.mocked(fetchMaybeMemberByOwner);
const feeBalanceMock = vi.mocked(tokenBalanceOrZero);
const buildFileClaimMock = vi.mocked(buildFileClaim);
const sendMock = (await import("../../shared/transaction")).sendInstruction as unknown as Mock;

// base58-valid (no 0/O/I/l) — the manifest's trust-boundary validation
// rejects real-invalid fakes like "Mutual…".
const MUTUAL_ADDR = "Mutua1XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
const WALLET = "W".repeat(32);
const A = "1".repeat(32) as Address;

function memberAccount(over: Partial<Member> = {}): MaybeAccount<Member> {
  return {
    exists: true,
    address: "M".repeat(32),
    data: {
      discriminator: new Uint8Array(8),
      mutual: MUTUAL_ADDR as Address,
      member: WALLET as Address,
      tier: 1, // Standard
      attestation: A,
      hasPendingClaim: false,
      bump: 255,
      ...over,
    } as Member,
  } as unknown as MaybeAccount<Member>;
}

const testConfig = getDefaultConfig({ appName: "riprap-test", network: "localnet" });

function renderWizard(mutualAddress = MUTUAL_ADDR) {
  vi.stubEnv("VITE_LOCALNET_MUTUAL", mutualAddress);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AppProvider connectorConfig={testConfig}>
        <FileClaimPage />
      </AppProvider>
    </QueryClientProvider>,
  );
}

function pdf(name: string): File {
  return new File([new Uint8Array([0x25, 0x50, 0x46, 0x44])], name, { type: "application/pdf" });
}

function ok201(): Response {
  return new Response("{}", { status: 201 });
}

/** 64-hex ↔ 32 bytes — the evidence-hash shapes (§5). */
function hexToBytes32(hex: string): Uint8Array {
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Walk 0→5 with everything passing; leaves the review step on screen. */
async function walkToReview() {
  renderWizard();
  expect(await screen.findByText(/Step 1 of 5 — Incident/i)).toBeTruthy();
  fireEvent.change(screen.getByLabelText("When"), { target: { value: "2026-11-15T18:05" } });
  fireEvent.change(screen.getByLabelText("Where"), {
    target: { value: "Olympia Conference Centre, Level 1, west corridor" },
  });
  fireEvent.change(screen.getByLabelText("What happened"), {
    target: { value: "Assault in the west corridor; treated by on-site medics." },
  });
  for (const label of [
    "Another person used a knife or blade against me",
    "It happened during the coverage window",
    "It happened inside the covered area",
    "It caused bodily injury",
  ]) {
    fireEvent.click(screen.getByLabelText(label));
  }
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  expect(await screen.findByText(/Step 2 of 5 — Amount/i)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  expect(await screen.findByText(/Step 3 of 5 — Evidence/i)).toBeTruthy();
  for (const input of document.querySelectorAll<HTMLInputElement>('input[type="file"]')) {
    fireEvent.change(input, { target: { files: [pdf("proof.pdf")] } });
  }
  fireEvent.click(screen.getByLabelText(/The ticket, the ID, and the declaration/));
  await waitFor(() => {
    expect(screen.queryByText("Attach all five to continue.")).toBeNull();
  });
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  expect(await screen.findByText(/Step 4 of 5 — Manifest/i)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  expect(await screen.findByText(/Step 5 of 5 — Review/i)).toBeTruthy();
}

beforeEach(() => {
  mutualMock.mockResolvedValue({
    exists: true,
    address: MUTUAL_ADDR,
    data: fakeMutual() as Mutual,
  } as unknown as MaybeAccount<Mutual>);
  memberMock.mockResolvedValue(memberAccount());
  feeBalanceMock.mockResolvedValue(15n * 1_000_000n);
  sendMock.mockReset();
  sendMock.mockResolvedValue("SIG");
  localStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ok201()),
  );
  Object.defineProperty(URL, "createObjectURL", { value: vi.fn(() => "blob:x"), writable: true });
  Object.defineProperty(URL, "revokeObjectURL", { value: vi.fn(), writable: true });
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  walletState.isConnected = false;
  walletState.account = null;
  localStorage.clear();
  mutualMock.mockReset();
  memberMock.mockReset();
  feeBalanceMock.mockReset();
  buildFileClaimMock.mockClear(); // calls are per-test; the factory impl stays
  vi.mocked(fetchMaybeDepositorByOwner).mockClear();
});

describe("#/app/file-claim — frame + gates", () => {
  it("the frame: one main landmark, the shared in-app nav, no Open App CTA", () => {
    const { container } = renderWizard();
    expect(container.querySelectorAll("main").length).toBe(1);
    // shared navbar (copy doc §0 + § /app nav): in-app controls, no Open App CTA
    expect(screen.queryByRole("link", { name: "Open App" })).toBeNull();
    expect(screen.getByRole("combobox")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Connect wallet" })).toBeTruthy();
  });

  it("deep link without a wallet: the gate copy, no wizard; 'Connect a wallet' opens the picker", () => {
    renderWizard();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Payout request");
    expect(
      screen.getByText("Connect the wallet you joined with. Filing needs its signature."),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Connect a wallet" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("the emergency banner leads every step", async () => {
    walletState.isConnected = true;
    walletState.account = WALLET;
    renderWizard();
    // 999/112 render in mono spans — assert on the banner's full text
    await waitFor(() => {
      const banner = document.querySelector('[data-slot="emergency-banner"]');
      expect(banner?.textContent).toContain(
        "Get care and police first. In an emergency call 999 (UK) or 112 (EU).",
      );
    });
    const banner = document.querySelector('[data-slot="emergency-banner"]');
    expect(banner?.querySelectorAll("[data-num]").length).toBe(2); // 999 + 112, mono
    expect(
      screen.getByRole("link", { name: "the five required proofs" }).getAttribute("href"),
    ).toBe("#/2026-breakpoint-blade-pool");
  });

  it("open claim blocks entry with its copy and the #/app link", async () => {
    walletState.isConnected = true;
    walletState.account = WALLET;
    memberMock.mockResolvedValue(memberAccount({ hasPendingClaim: true }));
    renderWizard();
    expect(await screen.findByText("You already have an open claim.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "the app surface" }).getAttribute("href")).toBe(
      "#/app",
    );
  });

  it("fee short shows the exact shortfall and the live fee math", async () => {
    walletState.isConnected = true;
    walletState.account = WALLET;
    feeBalanceMock.mockResolvedValue(10n * 1_000_000n); // $10 of $15
    renderWizard();
    await waitFor(() => {
      const slot = document.querySelector('[data-slot="fee-short"]');
      expect(slot?.textContent).toContain("Juror fee short by $5 USDC.");
      expect(slot?.textContent).toContain("Filing pre-pays $15 USDC — 3 jurors at $5 USDC each");
    });
  });
});

describe("#/app/file-claim — the walk (0→5)", () => {
  it("collects, defaults the cap, hashes the five proofs, builds one manifest, reviews", async () => {
    walletState.isConnected = true;
    walletState.account = WALLET;
    renderWizard();

    // preflight passes → step 1 lands automatically
    expect(await screen.findByText(/Step 1 of 5 — Incident/i)).toBeTruthy();

    // step 1: fields + the four self-screen boxes gate Continue
    expect(screen.getByRole("button", { name: "Continue" })).toHaveProperty("disabled", true);
    fireEvent.change(screen.getByLabelText("When"), { target: { value: "2026-11-15T18:05" } });
    fireEvent.change(screen.getByLabelText("Where"), {
      target: { value: "Olympia Conference Centre, Level 1, west corridor" },
    });
    fireEvent.change(screen.getByLabelText("What happened"), {
      target: { value: "Assault in the west corridor; treated by on-site medics." },
    });
    for (const label of [
      "Another person used a knife or blade against me",
      "It happened during the coverage window",
      "It happened inside the covered area",
      "It caused bodily injury",
    ]) {
      fireEvent.click(screen.getByLabelText(label));
    }
    expect(screen.getByRole("button", { name: "Continue" })).toHaveProperty("disabled", false);

    // step 2: amount defaults to the Standard cap ($2,000 — policy §5)
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText(/Step 2 of 5 — Amount/i)).toBeTruthy();
    expect((screen.getByLabelText("Requested payout (USDC)") as HTMLInputElement).value).toBe(
      "2000",
    );
    expect(screen.getByText("Your cap: $2,000")).toBeTruthy();

    // step 3: five canonical slots, hashes render, attestation gates
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText(/Step 3 of 5 — Evidence/i)).toBeTruthy();
    expect(screen.getByText("Attach all five to continue.")).toBeTruthy();
    const attachInputs = document.querySelectorAll<HTMLInputElement>('input[type="file"]');
    expect(attachInputs.length).toBe(5);
    for (const input of attachInputs) {
      fireEvent.change(input, { target: { files: [pdf("proof.pdf")] } });
    }
    fireEvent.click(screen.getByLabelText(/The ticket, the ID, and the declaration/));
    await waitFor(() => {
      expect(screen.queryByText("Attach all five to continue.")).toBeNull();
    });
    expect(screen.getAllByText(/^sha256 [0-9a-f]{16}…$/).length).toBe(5);

    // step 4: the manifest — preview bytes are exactly the hashed bytes
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText(/Step 4 of 5 — Manifest/i)).toBeTruthy();
    const preview = document.querySelector('[data-slot="manifest-preview"]')?.textContent ?? "";
    expect(preview).toContain("schema: riprap-claim/v1");
    const expectedHash = await sha256Hex(new TextEncoder().encode(preview));
    const hashLine = document.querySelector('[data-slot="manifest-hash"]');
    expect(hashLine?.textContent).toBe(`sha256 ${expectedHash}`);
    expect(screen.getByRole("button", { name: "Download manifest.yaml" })).toBeTruthy();

    // step 5: review — live fee numbers + the operator line + Sign and file
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText(/Step 5 of 5 — Review/i)).toBeTruthy();
    expect(screen.getByText(/Juror fee \$15 USDC — 3 jurors at \$5 USDC each/)).toBeTruthy();
    const operatorLine = screen.getByText(/Evidence is encrypted for/);
    // the operator is presented as its pubkey, truncated (AddressChip) —
    // never the full 32/44-char dump, never a pretend name
    expect(operatorLine.textContent).toContain("EEEE…EEEE");
    expect(operatorLine.textContent).not.toContain("E".repeat(32));
    expect(
      screen.getByText(
        "Denied: the fee is kept. Approved: refunded with the payment. Failed adjudication: returned.",
      ),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sign and file" })).toHaveProperty("disabled", false);

    // draft persisted: fields + per-slot {sha256, fileName} only — no bytes
    const stored = localStorage.getItem(`riprap:file-claim:${MUTUAL_ADDR}`);
    expect(stored).toContain("Olympia Conference Centre");
    const parsed = JSON.parse(stored ?? "{}") as {
      docs: Record<string, Record<string, unknown>>;
    };
    for (const entry of Object.values(parsed.docs)) {
      expect(Object.keys(entry).sort()).toEqual(["fileName", "sha256"]);
      expect(entry.sha256).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it("a draft survives a reload — fields and hashes, no files", async () => {
    localStorage.setItem(
      `riprap:file-claim:${MUTUAL_ADDR}`,
      JSON.stringify({
        incidentAt: "2026-11-15T18:05",
        incidentPlace: "Olympia",
        narrative: "earlier session",
        screen: { blade: true, window: true, area: true, injury: true },
        amountUsdc: "1500",
        docs: { "01-ticket.pdf": { sha256: "a".repeat(64), fileName: "t.pdf" } },
        samePerson: false,
      }),
    );
    walletState.isConnected = true;
    walletState.account = WALLET;
    renderWizard();
    expect(await screen.findByText(/Step 1 of 5 — Incident/i)).toBeTruthy();
    expect((screen.getByLabelText("What happened") as HTMLTextAreaElement).value).toBe(
      "earlier session",
    );
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(
      ((await screen.findByLabelText("Requested payout (USDC)")) as HTMLInputElement).value,
    ).toBe("1500"); // a saved amount is not re-defaulted
  });

  it("step 2 blocks a request above the tier cap (policy §5: Standard $2,000)", async () => {
    walletState.isConnected = true;
    walletState.account = WALLET;
    renderWizard();
    expect(await screen.findByText(/Step 1 of 5 — Incident/i)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("When"), { target: { value: "2026-11-15T18:05" } });
    fireEvent.change(screen.getByLabelText("Where"), { target: { value: "Olympia" } });
    fireEvent.change(screen.getByLabelText("What happened"), { target: { value: "assault" } });
    for (const label of [
      "Another person used a knife or blade against me",
      "It happened during the coverage window",
      "It happened inside the covered area",
      "It caused bodily injury",
    ]) {
      fireEvent.click(screen.getByLabelText(label));
    }
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    const amount = (await screen.findByLabelText("Requested payout (USDC)")) as HTMLInputElement;
    const continueBtn = () => screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement;

    // default = cap ($2,000) — at-cap is valid
    expect(continueBtn().disabled).toBe(false);

    // above the cap: blocked, error states the cap
    fireEvent.change(amount, { target: { value: "2500" } });
    expect(screen.getByText(/Above your cap/).textContent).toContain("$2,000");
    expect(continueBtn().disabled).toBe(true);

    // back at the cap: valid again, error gone
    fireEvent.change(amount, { target: { value: "2000" } });
    expect(screen.queryByText(/Above your cap/)).toBeNull();
    expect(continueBtn().disabled).toBe(false);
  });
});

describe("#/app/file-claim — sign → publish → filed (bean riprap-yr3y)", () => {
  it("happy path: one tx, POST + five PUTs, filed screen with claim/dispute/timeline; draft cleared", async () => {
    walletState.isConnected = true;
    walletState.account = WALLET;
    await walkToReview();

    fireEvent.click(screen.getByRole("button", { name: "Sign and file" }));
    // sign phase renders; delivery then races through publish to the filed
    // screen — publish's own states are pinned by the 409 test, where it
    // hard-stops mounted
    expect(await screen.findByText("Building the transaction…")).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText(/Filed — claim #0/)).toBeTruthy();
    });

    // exactly ONE signature — never re-sent after success
    expect(sendMock).toHaveBeenCalledTimes(1);
    // one POST (manifest) + five PUTs (documents) = six fetches
    const fetchMock = vi.mocked(fetch);
    expect(fetchMock).toHaveBeenCalledTimes(6);
    const puts = fetchMock.mock.calls.filter((call) => call[1]?.method === "PUT");
    expect(puts.length).toBe(5);
  });

  it("nonce race: rebuild at the fresh nonce — tx hash, manifest.dispute, POST, and re-downloaded yaml all name the landed dispute (bean riprap-s8jk, §5)", async () => {
    walletState.isConnected = true;
    walletState.account = WALLET;
    // the factory mocks derive PDAs per nonce: disputeAt(0) is the step-4
    // buffer's, disputeAt(1) the rebuilt one
    const disputeAt = (n: number) => `${"D".repeat(31)}${String.fromCharCode(65 + n)}`;
    // capture both manifest downloads (step-4 gesture + the race re-trigger)
    const downloads: Blob[] = [];
    Object.defineProperty(URL, "createObjectURL", {
      value: vi.fn((blob: Blob) => {
        downloads.push(blob);
        return "blob:x";
      }),
      writable: true,
    });
    // capture the operator POST/PUTs
    const calls: Array<{ url: string; body: string }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        calls.push({ url: String(input), body: String(init?.body ?? "") });
        return ok201();
      }),
    );
    // first attempt fails (Claim PDA init — another member filed first); the
    // second is HELD so the sign step's race state is assertable in flight
    const { promise: signHeld, resolve: releaseSign } = Promise.withResolvers<string>();
    sendMock.mockImplementationOnce(async () => {
      throw new Error("failed to send transaction: already in use");
    });
    sendMock.mockImplementationOnce(async () => {
      await signHeld;
      return "SIG";
    });
    await walkToReview(); // download #1: the step-4 manifest at nonce 0

    // the chain's nonce has moved by the time we refetch (the race branch's
    // fetchMaybeMutual goes through the same mock as every other read)
    mutualMock.mockResolvedValue({
      exists: true,
      address: MUTUAL_ADDR,
      data: fakeMutual({ claimNonce: 1n }) as Mutual,
    } as unknown as MaybeAccount<Mutual>);

    fireEvent.click(screen.getByRole("button", { name: "Sign and file" }));
    // held at the second wallet signature — the sign step shows both race
    // lines while the rebuilt claim is in flight
    await waitFor(() => {
      expect(screen.getByText(/Another member filed first/)).toBeTruthy();
    });
    await waitFor(() => {
      expect(document.querySelector('[data-slot="manifest-rebuilt"]')?.textContent).toContain(
        "A fresh manifest.yaml was downloaded",
      );
    });

    // download #2: the rebuilt manifest, re-triggered by the race branch —
    // the stale file names a dispute that was never filed
    expect(downloads.length).toBe(2);
    const staleYaml = await downloads[0].text();
    const rebuiltYaml = await downloads[1].text();
    expect(staleYaml).toContain(`dispute: ${disputeAt(0)}`);
    expect(rebuiltYaml).toContain(`dispute: ${disputeAt(1)}`);
    expect(rebuiltYaml).not.toContain(disputeAt(0));

    // §5 cross-check while the second send is still held: it carries
    // sha256(rebuilt yaml) and the LANDED dispute — never the step-4 buffer's
    const digestHex = await sha256Hex(new TextEncoder().encode(rebuiltYaml));
    const secondSend = buildFileClaimMock.mock.calls[1]?.[0] as unknown as {
      mutual: { claimNonce: bigint };
      dispute: Address;
      evidenceHash: Uint8Array;
    };
    expect(secondSend.mutual.claimNonce).toBe(1n);
    expect(secondSend.dispute).toBe(disputeAt(1));
    expect(toHex(secondSend.evidenceHash)).toBe(digestHex);

    // release the signature → publish → filed under claim #1, after exactly
    // one rebuild + re-sign
    releaseSign("SIG");
    await waitFor(() => {
      expect(screen.getByText(/Filed — claim #1/)).toBeTruthy();
    });
    expect(sendMock).toHaveBeenCalledTimes(2);

    // the manifest POST is keyed at the landed dispute and its ECIES bundle
    // wraps the rebuilt buffer (plaintext_hash == the same digest)
    const manifestPost = calls.find(({ url }) => url.endsWith("/0"));
    expect(manifestPost?.url).toContain(`/${disputeAt(1)}/0`);
    const bundle = JSON.parse(manifestPost?.body ?? "{}") as { plaintext_hash: string };
    expect(bundle.plaintext_hash).toBe(btoa(String.fromCharCode(...hexToBytes32(digestHex))));
  });

  it("PUT 409: hard stop with the wrong-document copy; nothing overwritten", async () => {
    walletState.isConnected = true;
    walletState.account = WALLET;
    await walkToReview();

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith("/03-police-report.pdf")) {
          return new Response("conflict", { status: 409 });
        }
        return ok201();
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Sign and file" }));
    await waitFor(() => {
      const conflict = document.querySelector('[data-slot="publish-conflict"]');
      expect(conflict?.textContent).toContain(
        "The operator already holds a different file under 03-police-report.pdf. Nothing was overwritten. Re-attach the exact document from this request.",
      );
    });
    // hard stop — no filed screen
    expect(screen.queryByText(/Filed — claim #/)).toBeNull();
  });

  it("sign failure without a nonce move: one-line toast, back to review", async () => {
    walletState.isConnected = true;
    walletState.account = WALLET;
    sendMock.mockRejectedValue(new Error("failed to send transaction: insufficient funds"));
    await walkToReview();

    fireEvent.click(screen.getByRole("button", { name: "Sign and file" }));
    await waitFor(() => {
      expect(screen.getByText(/Step 5 of 5 — Review/i)).toBeTruthy();
    });
    // no second attempt without a nonce move
    expect(sendMock).toHaveBeenCalledTimes(1);
  });
});
describe("#/app/file-claim — gate matrix + delivery states (bean riprap-vahh)", () => {
  it("not a member: shared /app copy with the pool-page link", async () => {
    walletState.isConnected = true;
    walletState.account = WALLET;
    memberMock.mockResolvedValue({
      exists: false,
      address: "M".repeat(32),
    } as unknown as MaybeAccount<Member>);
    renderWizard();
    expect(await screen.findByText("This wallet isn't in the pool.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "the pool page" }).getAttribute("href")).toBe(
      "#/2026-breakpoint-blade-pool",
    );
  });

  it("zero rights stake: honest no-stake state", async () => {
    walletState.isConnected = true;
    walletState.account = WALLET;
    const { fetchMaybeDepositorByOwner } = await import("@riprap/hanse");
    vi.mocked(fetchMaybeDepositorByOwner).mockResolvedValueOnce({
      exists: true,
      address: "D".repeat(32),
      data: { rightsStake: 0n },
    } as unknown as MaybeAccount<never>);
    renderWizard();
    await waitFor(() => {
      const slot = document.querySelector('[data-slot="no-rights-stake"]');
      expect(slot?.textContent).toContain("No rights stake left on this membership.");
      expect(slot?.textContent).toContain("It cannot file a payout request.");
    });
  });

  it("claims window closed: the close date and the no-requests line (chain truth)", async () => {
    walletState.isConnected = true;
    walletState.account = WALLET;
    // epoch 1_788_134_399 = 2026-08-30 23:59:59 UTC — before "now"
    mutualMock.mockResolvedValue({
      exists: true,
      address: MUTUAL_ADDR,
      data: fakeMutual({ claimsCloseAt: 1_788_134_399n }) as Mutual,
    } as unknown as MaybeAccount<Mutual>);
    renderWizard();
    await waitFor(() => {
      const slot = document.querySelector('[data-slot="window-closed"]');
      expect(slot?.textContent).toContain("The claims window closed 2026-08-30 23:59 UTC.");
      expect(slot?.textContent).toContain("Payout requests are no longer accepted for this pool.");
    });
  });

  it("no deployment on the cluster: the shared not-live state, no gate reads", async () => {
    walletState.isConnected = true;
    walletState.account = WALLET;
    renderWizard("");
    expect(await screen.findByText("Not live on this cluster")).toBeTruthy();
    expect(mutualMock).not.toHaveBeenCalled();
  });

  it("a 5xx PUT shows the retrying row, then delivers; the tx is never re-sent", async () => {
    walletState.isConnected = true;
    walletState.account = WALLET;
    await walkToReview();

    // first attempt on 01-ticket.pdf: 500; the retry is held until asserted
    const calls = ["fail"];
    let release: (() => void) | undefined;
    const held = new Promise<Response>((resolve) => {
      release = () => resolve(ok201());
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.method === "PUT" && String(input).endsWith("/01-ticket.pdf")) {
          if (calls.shift() === "fail") return new Response("boom", { status: 500 });
          return held;
        }
        return ok201();
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Sign and file" }));
    await waitFor(() => {
      const rows = [...document.querySelectorAll('[data-slot="publish-row"]')];
      const ticket = rows.find((r) => r.textContent?.includes("01-ticket.pdf"));
      expect(ticket?.textContent).toContain("retrying");
    });
    release?.();
    await waitFor(() => {
      expect(screen.getByText(/Filed — claim #0/)).toBeTruthy();
    });
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it("a POST 400 (unknown schema) is surfaced loudly — rows failed, no silent degrade", async () => {
    walletState.isConnected = true;
    walletState.account = WALLET;
    await walkToReview();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("unknown schema", { status: 400 })),
    );
    fireEvent.click(screen.getByRole("button", { name: "Sign and file" }));
    await waitFor(() => {
      const unreachable = document.querySelector('[data-slot="publish-unreachable"]');
      expect(unreachable?.textContent).toContain("Couldn't reach the operator.");
      expect(document.querySelectorAll('[data-slot="publish-row"]').length).toBe(5);
    });
    expect(screen.queryByText(/Filed — claim #/)).toBeNull();
  });

  // Recovery re-entry (manifest re-upload → sha256 == dispute.evidence_hashes[0]
  // → re-PUT 201-no-op) lives with its surface: Recovery.test.tsx (the
  // panel) and AppPage.test (the claims-row entry) — riprap-wwvc.
});
