// #/app/file-claim — the wizard smoke (bean riprap-myu7): gate states, the
// full 0→5 walk (incident → amount → evidence → manifest → review), and the
// invariants that belong to THIS bean: draft persistence (fields + hashes
// only), the single-buffer manifest (preview bytes == hashed bytes), and
// review numbers from the live-read mocks. Copy verbatim from
// meta/marketing/03-website-copy/landing-page.md § /app/file-claim.

import {
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
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeMutual } from "../../pool/fixtures";
import { sha256Hex } from "./documents";
import { FileClaimPage } from "./FileClaimPage";

// operator discovery is its own lane surface — stubbed to the ready answer
vi.mock("./useEvidenceOperator", () => ({
  useEvidenceOperator: () => ({
    state: "ready",
    operator: {
      name: "Accord Evidence",
      url: "https://evidence.example",
      encryptionKey: "k",
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
    findClaimPda: vi.fn(async () => ["C".repeat(32) as Address, 255]),
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
  findDisputePda: vi.fn(async () => ["P".repeat(32) as Address, 255]),
}));

vi.mock("../../shared/rpc", () => ({
  useClusterRpc: () => ({
    endpoint: "http://127.0.0.1:8899",
    rpc: { getBalance: () => ({ send: async () => ({ value: 1n }) }) },
    rpcSubscriptions: {},
  }),
  useHanseEnv: () => null,
}));

const mutualMock = vi.mocked(fetchMaybeMutual);
const memberMock = vi.mocked(fetchMaybeMemberByOwner);
const feeBalanceMock = vi.mocked(tokenBalanceOrZero);

const MUTUAL_ADDR = "MutualXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
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

function renderWizard() {
  vi.stubEnv("VITE_LOCALNET_MUTUAL", MUTUAL_ADDR);
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

beforeEach(() => {
  mutualMock.mockResolvedValue({
    exists: true,
    address: MUTUAL_ADDR,
    data: fakeMutual() as Mutual,
  } as unknown as MaybeAccount<Mutual>);
  memberMock.mockResolvedValue(memberAccount());
  feeBalanceMock.mockResolvedValue(15n * 1_000_000n);
  localStorage.clear();
  // jsdom has no object URLs — the download path only needs to not throw
  Object.defineProperty(URL, "createObjectURL", { value: vi.fn(() => "blob:x"), writable: true });
  Object.defineProperty(URL, "revokeObjectURL", { value: vi.fn(), writable: true });
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  walletState.isConnected = false;
  walletState.account = null;
  localStorage.clear();
});

describe("#/app/file-claim — frame + gates", () => {
  it("deep link without a wallet: the gate copy, no wizard", () => {
    renderWizard();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Payout request");
    expect(
      screen.getByText("Connect the wallet you joined with. Filing needs its signature."),
    ).toBeTruthy();
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
    expect(screen.getByRole("link", { name: "the five required proofs" })).toBeTruthy();
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
    expect(preview).toContain("01-ticket.pdf");
    expect(preview).toContain("05-statutory-declaration.pdf");
    expect(preview).toContain('options: { recipe: hanse-opt/v1, labels: ["Approve", "Deny"] }');
    const expectedHash = await sha256Hex(new TextEncoder().encode(preview));
    const hashLine = document.querySelector('[data-slot="manifest-hash"]');
    expect(hashLine?.textContent).toBe(`sha256 ${expectedHash}`);
    expect(screen.getByRole("button", { name: "Download manifest.yaml" })).toBeTruthy();

    // step 5: review — live fee numbers + the operator line
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText(/Step 5 of 5 — Review/i)).toBeTruthy();
    expect(screen.getByText(/Juror fee \$15 USDC — 3 jurors at \$5 USDC each/)).toBeTruthy();
    // the operator name renders inside a span — match the line, then the name
    const operatorLine = screen.getByText(/Evidence is encrypted for/);
    expect(operatorLine.textContent).toContain("Accord Evidence");
    expect(operatorLine.textContent).toContain("the pool's evidence operator");
    expect(
      screen.getByText(
        "Denied: the fee is kept. Approved: refunded with the payment. Failed adjudication: returned.",
      ),
    ).toBeTruthy();

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
});
