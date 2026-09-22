// Recovery.tsx — the #/app claim-detail recovery surface (bean riprap-wwvc):
// manifest re-upload gate (sha256 == dispute.evidence_hashes[0], a pure
// chain read), the five re-attach slots, and idempotent re-delivery
// (POST no-op + per-file PUTs; 409 surfaced). Copy verbatim from
// landing-page.md § /app "Claim rows, evidence + recovery".

import type { Address } from "@solana/kit";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sha256Hex } from "./documents";
import { Recovery } from "./Recovery";

vi.mock("./useEvidenceOperator", async () => {
  // a REAL Ed25519 point — claimantEncrypt runs for real during re-delivery
  const { ed25519PublicKeyFromSeed } = await import("@useaccord/sdk/evidence");
  const key = Array.from(ed25519PublicKeyFromSeed(new Uint8Array(32).fill(5)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return {
    resolveEvidenceOperator: vi.fn(async () => ({
      name: "Accord Evidence",
      url: "https://evidence.example",
      encryptionKey: key,
      healthy: true,
    })),
  };
});

const disputeMock = vi.hoisted(() => ({ fetchDispute: vi.fn() }));
vi.mock("@useaccord/sdk", () => ({
  fetchDispute: disputeMock.fetchDispute,
  fetchSubaccordMaybe: vi.fn(async () => ({
    exists: true,
    address: "S".repeat(32),
    data: { evidenceOperator: "E".repeat(32), minJurySize: 3, feePerJuror: 5n * 1_000_000n },
  })),
}));

const CLUSTER_RPC = {
  endpoint: "http://127.0.0.1:8899",
  rpc: { getBalance: () => ({ send: async () => ({ value: 1n }) }) },
  rpcSubscriptions: {},
} as unknown as Parameters<typeof Recovery>[0]["clusterRpc"];

const MUTUAL = "MutualXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" as Address;
const DISPUTE = "D".repeat(32) as Address;
const SUBACCORD = "S".repeat(32) as Address;

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function yamlFile(bytes = new TextEncoder().encode("schema: riprap-claim/v1\n")): File {
  return new File([bytes], "manifest.yaml", { type: "text/yaml" });
}

function pdf(name: string): File {
  return new File([new Uint8Array([0x25, 0x50, 0x46, 0x44])], name, { type: "application/pdf" });
}

/** Manifest input #1, doc inputs after it — file inputs appear in DOM order. */
function setInputFiles(input: HTMLInputElement, files: File[]): void {
  fireEvent.change(input, { target: { files } });
}

function renderRecovery() {
  return render(
    <Recovery
      clusterRpc={CLUSTER_RPC}
      mutual={MUTUAL}
      subaccord={SUBACCORD}
      dispute={DISPUTE}
      nonce={0n}
    />,
  );
}

async function disputeHashOf(manifest: Uint8Array): Promise<string> {
  return await sha256Hex(manifest);
}

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("{}", { status: 201 })),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  localStorage.clear();
});

describe("Recovery — the manifest gate (pure chain read)", () => {
  it("a matching manifest verifies: sha256(manifest) == evidence_hashes[0]", async () => {
    const manifest = new TextEncoder().encode("schema: riprap-claim/v1\nentries:\n");
    disputeMock.fetchDispute.mockResolvedValue({
      data: { evidenceHashes: [hexToBytes(await disputeHashOf(manifest))] },
    });
    renderRecovery();
    expect(screen.getByText("Re-upload your manifest.yaml")).toBeTruthy();

    const inputs = document.querySelectorAll<HTMLInputElement>('input[type="file"]');
    setInputFiles(inputs[0]!, [yamlFile(manifest)]);
    expect(
      await screen.findByText(
        "Manifest verified against the claim — re-attach the five documents.",
      ),
    ).toBeTruthy();
    // five re-attach slots render
    expect(document.querySelectorAll('input[type="file"]').length).toBe(5);
  });

  it("a foreign manifest is refused", async () => {
    disputeMock.fetchDispute.mockResolvedValue({
      data: { evidenceHashes: [new Uint8Array(32).fill(7)] },
    });
    renderRecovery();
    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    setInputFiles(input!, [yamlFile()]);
    expect(await screen.findByText("This manifest doesn't match this claim.")).toBeTruthy();
  });
});

describe("Recovery — re-delivery (idempotent)", () => {
  it("re-POSTs the manifest (no-op) and re-PUTs the five files; records delivery", async () => {
    const manifest = new TextEncoder().encode("schema: riprap-claim/v1\n");
    disputeMock.fetchDispute.mockResolvedValue({
      data: { evidenceHashes: [hexToBytes(await disputeHashOf(manifest))] },
    });
    renderRecovery();
    setInputFiles(document.querySelector<HTMLInputElement>('input[type="file"]')!, [
      yamlFile(manifest),
    ]);
    await screen.findByText(/Manifest verified against the claim/);

    const docInputs = [...document.querySelectorAll<HTMLInputElement>('input[type="file"]')].slice(
      0,
      5,
    );
    for (const input of docInputs) {
      setInputFiles(input, [pdf("proof.pdf")]);
    }
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Redeliver evidence" })).toHaveProperty(
        "disabled",
        false,
      );
    });
    fireEvent.click(screen.getByRole("button", { name: "Redeliver evidence" }));

    expect(await screen.findByText("Evidence: delivered")).toBeTruthy();
    const fetchMock = vi.mocked(fetch);
    expect(fetchMock).toHaveBeenCalledTimes(6); // 1 POST + 5 PUTs
    // the local record now marks the claim complete for the #/app line
    expect(localStorage.getItem(`riprap:evidence:${MUTUAL}:0`)).toBeTruthy();
  });

  it("a 409 leaf is a hard stop — wrong document, nothing overwritten", async () => {
    const manifest = new TextEncoder().encode("schema: riprap-claim/v1\n");
    disputeMock.fetchDispute.mockResolvedValue({
      data: { evidenceHashes: [hexToBytes(await disputeHashOf(manifest))] },
    });
    renderRecovery();
    setInputFiles(document.querySelector<HTMLInputElement>('input[type="file"]')!, [
      yamlFile(manifest),
    ]);
    await screen.findByText(/Manifest verified against the claim/);
    const docInputs = [...document.querySelectorAll<HTMLInputElement>('input[type="file"]')].slice(
      0,
      5,
    );
    for (const input of docInputs) {
      setInputFiles(input, [pdf("proof.pdf")]);
    }
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Redeliver evidence" })).toHaveProperty(
        "disabled",
        false,
      );
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) =>
        String(input).endsWith("/04-medical-report.pdf")
          ? new Response("conflict", { status: 409 })
          : new Response("{}", { status: 201 }),
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Redeliver evidence" }));
    await waitFor(() => {
      const conflict = [...document.querySelectorAll("p")].find((p) =>
        p.textContent?.includes("already holds a different file"),
      );
      expect(conflict?.textContent).toContain(
        "The operator already holds a different file under 04-medical-report.pdf. Nothing was overwritten. Re-attach the exact document from this request.",
      );
    });
    expect(screen.queryByText("Evidence: delivered")).toBeNull();
  });
});
