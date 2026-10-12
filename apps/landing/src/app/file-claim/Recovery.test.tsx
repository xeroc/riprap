// Recovery.tsx — the claim restore surface (copy doc § /app/file-claim
// RESTORE, 2026-10-12): the operator's stored manifest is read FIRST (public
// endpoint); when it holds nothing the kept manifest.yaml uploads manually.
// Either way sha256(manifest) == Dispute.evidence_hashes[0] is the gate, the
// verified bytes parse into the read-only facts, and re-delivery runs the
// PUBLISH table (manifest row first, per-row retry, 409 hard stop). Copy
// verbatim from landing-page.md.

import type { Address } from "@solana/kit";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sha256Hex } from "./documents";
import { BLADE_POOL_FLOW } from "./flows/blade-pool";
import { TOLY_FUEL_FLOW } from "./flows/toly-needs-his-fuel";
import { buildClaimManifest } from "./manifest";
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

// base58-valid (no 0/O/I/l) — the manifest's trust-boundary validation
// rejects real-invalid fakes like "Mutual…".
const MUTUAL = "Mutua1XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" as Address;
const DISPUTE = "D".repeat(32) as Address;
const SUBACCORD = "S".repeat(32) as Address;

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function pdf(name: string): File {
  return new File([new Uint8Array([0x25, 0x50, 0x46, 0x44])], name, { type: "application/pdf" });
}

function setInputFiles(input: HTMLInputElement, files: File[]): void {
  fireEvent.change(input, { target: { files } });
}

/** Real `riprap-claim/v1` bytes — the stored/uploaded manifest must parse,
 * so the fixtures are built by the builder, never hand-written. Built
 * against `flow`'s own slots — a bounty manifest is not a blade manifest. */
async function builtManifest(
  flow: typeof BLADE_POOL_FLOW | typeof TOLY_FUEL_FLOW = BLADE_POOL_FLOW,
  over: { requestedAmountUsdc?: bigint } = {},
) {
  const built = await buildClaimManifest(
    {
      subaccord: SUBACCORD,
      filer: MUTUAL,
      mutual: MUTUAL,
      member: "W".repeat(32),
      filedAt: "2026-11-15T19:05:00Z",
      title: "Payout request — knife assault, 2026-11-15",
      claimContext: {
        incidentAt: "2026-11-15T18:05:00Z",
        incidentPlace: "Olympia Convention Centre, Level 1, west corridor",
        requestedAmountUsdc: over.requestedAmountUsdc ?? 2_000n * 1_000_000n,
        tier: "Standard",
        contributionUsdc: 20n * 1_000_000n,
      },
      entries: await Promise.all(
        flow.documentSlots.map(async (slot) =>
          slot.url === undefined
            ? { path: slot.path, sha256: await sha256Hex(new TextEncoder().encode(slot.path)) }
            : {
                url: "https://x.com/toly/status/2109422383966933008",
                sha256: await sha256Hex(new TextEncoder().encode(slot.path)),
              },
        ),
      ),
    },
    flow.documentSlots,
  );
  return { bytes: new TextEncoder().encode(built.yaml), sha256: built.sha256Hex };
}

/** The operator's stored-manifest GET — 200 with `bytes` or 404 (nothing
 * held); every POST/PUT answers 201. */
function stubOperator(stored: Uint8Array<ArrayBuffer> | null): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      if (method === "GET") {
        return stored === null
          ? new Response("no bundle", { status: 404 })
          : new Response(stored.buffer as ArrayBuffer, { status: 200 });
      }
      return new Response("{}", { status: 201 });
    }),
  );
}

function renderRecovery(
  slots: Parameters<typeof Recovery>[0]["slots"] = BLADE_POOL_FLOW.documentSlots,
) {
  return render(
    <Recovery
      clusterRpc={CLUSTER_RPC}
      mutual={MUTUAL}
      subaccord={SUBACCORD}
      dispute={DISPUTE}
      nonce={0n}
      slots={slots}
    />,
  );
}

/** Reach review via the stored-manifest path (the happy entry). */
async function renderAtReview(
  flow: typeof BLADE_POOL_FLOW | typeof TOLY_FUEL_FLOW = BLADE_POOL_FLOW,
  slots: Parameters<typeof Recovery>[0]["slots"] = BLADE_POOL_FLOW.documentSlots,
) {
  const manifest = await builtManifest(flow);
  disputeMock.fetchDispute.mockResolvedValue({
    data: { evidenceHashes: [hexToBytes(manifest.sha256)] },
  });
  stubOperator(manifest.bytes);
  renderRecovery(slots);
  await screen.findByText(/Claim #0 — as filed/);
  return manifest;
}

/** Attach a pdf to every file-slot row (review's Attach inputs). */
async function attachAll() {
  const inputs = [...document.querySelectorAll<HTMLInputElement>('input[type="file"]')];
  for (const input of inputs) {
    setInputFiles(input, [pdf("proof.pdf")]);
  }
  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Redeliver evidence" })).toHaveProperty(
      "disabled",
      false,
    );
  });
}

beforeEach(() => {
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  localStorage.clear();
});

describe("Recovery — entry: the operator's manifest first", () => {
  it("a held manifest verifies straight into the read-only review", async () => {
    const manifest = await builtManifest();
    disputeMock.fetchDispute.mockResolvedValue({
      data: { evidenceHashes: [hexToBytes(manifest.sha256)] },
    });
    stubOperator(manifest.bytes);
    renderRecovery();

    expect(await screen.findByText(/Claim #0 — as filed/)).toBeTruthy();
    // the read-only facts, labels verbatim with REVIEW
    expect(screen.getByText("$2,000")).toBeTruthy();
    expect(screen.getByText("2026-11-15T18:05:00Z")).toBeTruthy();
    expect(screen.getByText("Standard")).toBeTruthy();
    expect(screen.getByText("$20")).toBeTruthy();
    // the manifest hash, full-length mono
    expect(screen.getByText(new RegExp(`manifest.yaml — sha256 ${manifest.sha256}`))).toBeTruthy();
    // five attach rows carry their manifest hashes
    const rows = [...document.querySelectorAll("li")];
    expect(rows.some((r) => r.textContent?.includes("01-ticket.pdf — sha256"))).toBe(true);
  });

  it("nothing held: the manual upload path, then the same chain gate", async () => {
    const manifest = await builtManifest();
    disputeMock.fetchDispute.mockResolvedValue({
      data: { evidenceHashes: [hexToBytes(manifest.sha256)] },
    });
    stubOperator(null);
    renderRecovery();

    expect(
      await screen.findByText("The operator doesn't hold this claim's manifest."),
    ).toBeTruthy();
    setInputFiles(document.querySelector('input[type="file"]') as HTMLInputElement, [
      new File([manifest.bytes], "manifest.yaml", { type: "text/yaml" }),
    ]);
    expect(await screen.findByText(/Claim #0 — as filed/)).toBeTruthy();
  });

  it("a manifest whose hash misses the chain slot is refused — fetched or uploaded alike", async () => {
    const held = await builtManifest();
    const onChain = await builtManifest(BLADE_POOL_FLOW, {
      requestedAmountUsdc: 1_000n * 1_000_000n,
    });
    disputeMock.fetchDispute.mockResolvedValue({
      data: { evidenceHashes: [hexToBytes(onChain.sha256)] },
    });
    stubOperator(held.bytes);
    renderRecovery();

    expect(await screen.findByText("This manifest doesn't match this claim.")).toBeTruthy();
  });
});

describe("Recovery — re-delivery (idempotent; the PUBLISH table)", () => {
  it("re-POSTs the manifest (no-op) and re-PUTs the five files; records delivery", async () => {
    await renderAtReview();
    await attachAll();
    fireEvent.click(screen.getByRole("button", { name: "Redeliver evidence" }));

    expect(await screen.findByText("Evidence: delivered")).toBeTruthy();
    const fetchMock = vi.mocked(fetch);
    // 1 GET (entry) + 1 POST + 5 PUTs — and the table carried the manifest row
    expect(fetchMock).toHaveBeenCalledTimes(7);
    // the local record now marks the claim complete for the #/app line
    expect(localStorage.getItem(`riprap:evidence:${MUTUAL}:0`)).toBeTruthy();
  });

  it("a 409 leaf is a hard stop — wrong document, nothing overwritten, no retry", async () => {
    const manifest = await builtManifest();
    disputeMock.fetchDispute.mockResolvedValue({
      data: { evidenceHashes: [hexToBytes(manifest.sha256)] },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const method = init?.method ?? "GET";
        if (method === "GET") return new Response(manifest.bytes, { status: 200 });
        if (String(input).endsWith("/04-medical-report.pdf")) {
          return new Response("conflict", { status: 409 });
        }
        return new Response("{}", { status: 201 });
      }),
    );
    renderRecovery();
    await screen.findByText(/Claim #0 — as filed/);
    await attachAll();
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
    // hard stop — no Retry buttons past a conflict
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
  });

  it("a failed PUT row retries and completes — same path as the wizard", async () => {
    const manifest = await builtManifest();
    disputeMock.fetchDispute.mockResolvedValue({
      data: { evidenceHashes: [hexToBytes(manifest.sha256)] },
    });
    let ticketDown = true;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const method = init?.method ?? "GET";
        if (method === "GET") return new Response(manifest.bytes, { status: 200 });
        if (method === "PUT" && String(input).endsWith("/01-ticket.pdf") && ticketDown) {
          return new Response("boom", { status: 500 });
        }
        return new Response("{}", { status: 201 });
      }),
    );
    renderRecovery();
    await screen.findByText(/Claim #0 — as filed/);
    await attachAll();
    fireEvent.click(screen.getByRole("button", { name: "Redeliver evidence" }));

    await waitFor(() => {
      const rows = [...document.querySelectorAll('[data-slot="publish-row"]')];
      const ticket = rows.find((r) => r.textContent?.includes("01-ticket.pdf"));
      expect(ticket?.textContent).toContain("failed");
    });
    ticketDown = false;
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("Evidence: delivered")).toBeTruthy();
  });

  it("a bounty claim restores too — its own slots, url entry and all", async () => {
    const manifest = await builtManifest(TOLY_FUEL_FLOW);
    disputeMock.fetchDispute.mockResolvedValue({
      data: { evidenceHashes: [hexToBytes(manifest.sha256)] },
    });
    stubOperator(manifest.bytes);
    renderRecovery(TOLY_FUEL_FLOW.documentSlots);

    expect(await screen.findByText(/Claim #0 — as filed/)).toBeTruthy();
    // the bounty's own paths parse and render — no blade-slot error
    const rows = [...document.querySelectorAll("li")];
    expect(rows.some((r) => r.textContent?.includes("03-request-evidence.png — sha256"))).toBe(
      true,
    );
    // the url slot's row shows its RAW link (the URL-path entry)
    expect(
      rows.some((r) => r.textContent?.includes("https://x.com/toly/status/2109422383966933008")),
    ).toBe(true);
    // only the four FILE slots attach — the url slot rides the manifest
    expect(document.querySelectorAll('input[type="file"]').length).toBe(4);

    // redelivery: GET + POST + 4 PUTs — the url slot delivered with the POST
    const inputs = [...document.querySelectorAll<HTMLInputElement>('input[type="file"]')];
    for (const input of inputs) {
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
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(6);
  });

  it("stored bytes of another pool's shape fall back to the upload prompt with the parse message — never a dead end", async () => {
    // a TOLY manifest held against a BLADE restore — the cross-flow case
    const stored = await builtManifest(TOLY_FUEL_FLOW);
    disputeMock.fetchDispute.mockResolvedValue({
      data: { evidenceHashes: [hexToBytes(stored.sha256)] },
    });
    stubOperator(stored.bytes);
    renderRecovery(); // blade slots

    expect(
      await screen.findByText("The operator doesn't hold this claim's manifest."),
    ).toBeTruthy();
    // the parse message rides the prompt — naming the blade path it expected
    expect(screen.getByText(/bad entry for 03-police-report.pdf/)).toBeTruthy();
    // and the manual upload still works: the blade bytes via the blade slots
    const manifest = await builtManifest(BLADE_POOL_FLOW);
    disputeMock.fetchDispute.mockResolvedValue({
      data: { evidenceHashes: [hexToBytes(manifest.sha256)] },
    });
    setInputFiles(document.querySelector('input[type="file"]') as HTMLInputElement, [
      new File([manifest.bytes], "manifest.yaml", { type: "text/yaml" }),
    ]);
    expect(await screen.findByText(/Claim #0 — as filed/)).toBeTruthy();
  });
});
