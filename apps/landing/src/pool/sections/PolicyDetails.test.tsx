// The policy details' RAW POLICY tab against the evidence daemon's domain-CAS
// contract (SPEC.md §HTTP API, HANSE_DOMAIN_SPEC_UPLOAD §2/§4): GET by derived
// domain_ref, 404 → upload remedy, hash-gated proof-mode PUT. Ported from the
// retired anchored-terms band's suite (2026-09-27) — the band was folded into
// the collapsed policy as its raw tab. The mutual is mocked to the worked
// vector (seed 1, policy_hash d5756c2e… → domain_ref f76adcdd…), so URL
// assertions double as derivation assertions. fetch is stubbed — no network
// in jsdom.
import type { Mutual } from "@riprap/hanse";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeMutual } from "../fixtures";
import { type MutualQuery, useMutual } from "../useMutual";
import { PolicyDetails } from "./PolicyDetails";

// PolicyDetails resolves the daemon URL from the ACTIVE cluster — stub the
// connector hook (devnet) so the suite exercises the default→devnet path.
vi.mock("@solana/connector", () => ({
  useCluster: () => ({
    clusters: [{ id: "solana:devnet", label: "Devnet" }],
    cluster: { id: "solana:devnet", label: "Devnet" },
    setCluster: vi.fn(),
  }),
}));

vi.mock("../useMutual", () => ({ useMutual: vi.fn() }));
const mutualMock = vi.mocked(useMutual);

const BASE = "http://evidence.test";
const POLICY_HASH = "d5756c2e6ec42a9a557da82b0ac7000a7c0e613f997fb822407c7a43801172b4";
const DOMAIN_REF = "f76adcdd011256053753e5f5c9a4f73bca8645fdb8b566ef8c3a431085ec686e";
const PREIMAGE =
  "68616e73653a7375626163636f72640100000000000000" +
  "d5756c2e6ec42a9a557da82b0ac7000a7c0e613f997fb822407c7a43801172b4";
const DOC_TEXT = "# Hanse Cover Terms\n\nPilot v1 mutual cover terms.\n";
const DOC = new TextEncoder().encode(DOC_TEXT);

const READY: MutualQuery = (() => {
  const policyHash = new Uint8Array(32);
  for (let i = 0; i < 32; i++)
    policyHash[i] = Number.parseInt(POLICY_HASH.slice(i * 2, i * 2 + 2), 16);
  return {
    state: "ready",
    mutual: fakeMutual({ seed: 1n, policyHash }) as Mutual,
    depositsOpen: true,
  };
})();

const fetchStub = vi.fn();
const writeText = vi.fn().mockResolvedValue(undefined);

function response(status: number, body?: string): Response {
  return new Response(body ?? null, { status });
}

/** Render the policy details and switch to the RAW POLICY tab — the old band's home. */
function renderRawTab() {
  vi.stubEnv("VITE_EVIDENCE_DAEMON_URL_DEVNET", BASE);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  });
  const result = render(
    <QueryClientProvider client={queryClient}>
      <PolicyDetails />
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByRole("tab", { name: "Raw policy" }));
  return result;
}

function pickFile(file: File) {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [file] } });
}

beforeEach(() => {
  mutualMock.mockReturnValue(READY);
  vi.stubGlobal("fetch", fetchStub);
  Object.assign(navigator, { clipboard: { writeText } });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  fetchStub.mockReset();
  writeText.mockClear();
});

describe("policy details — collapsed by default, EXPLAINED first (copy doc § Policy details)", () => {
  it("the native details starts shut; tab panels mount, one visible at a time", async () => {
    fetchStub.mockResolvedValueOnce(response(200, DOC_TEXT));
    const { container } = renderRawTab(); // switches to raw
    const details = container.querySelector(
      'details[data-slot="policy-details"]',
    ) as HTMLDetailsElement | null;
    expect(details).not.toBeNull();
    expect(details?.open).toBe(false);
    expect(details?.textContent).toContain("Open the policy — explained, or verbatim");
    // both panels stay mounted; the inactive (explained) one hidden
    expect(container.querySelector("#policy-panel-explained")?.hasAttribute("hidden")).toBe(true);
    expect(container.querySelector("#policy-panel-raw")?.hasAttribute("hidden")).toBe(false);
    // settle the doc query inside the test — a pending retry would otherwise
    // leak past cleanup and eat the next test's fetch mock
    await screen.findByText(/COVER TERMS · 50 BYTES · VERBATIM/);
  });

  it("tab buttons flip the panels (one visible at a time)", async () => {
    fetchStub.mockResolvedValueOnce(response(200, DOC_TEXT));
    const { container } = renderRawTab();
    fireEvent.click(screen.getByRole("tab", { name: "Explained" }));
    expect(container.querySelector("#policy-panel-explained")?.hasAttribute("hidden")).toBe(false);
    expect(container.querySelector("#policy-panel-raw")?.hasAttribute("hidden")).toBe(true);
    await screen.findByText(/COVER TERMS · 50 BYTES · VERBATIM/);
  });
});

describe("raw policy tab — GET by derived domain_ref (HANSE §4 vector)", () => {
  it("serves the doc: immutable framing, anchor chips, framed verbatim document", async () => {
    fetchStub.mockResolvedValueOnce(response(200, DOC_TEXT));
    renderRawTab();
    const docEl = await screen.findByText(/Pilot v1 mutual cover terms/);
    expect(
      screen.getByRole("heading", { level: 3, name: "The immutable terms of this mutual." }),
    ).toBeTruthy();
    expect(screen.getByLabelText("copy policy hash").textContent).toContain("d575…72b4");
    expect(screen.getByLabelText("copy domain ref").textContent).toContain("f76a…686e");
    // framed document: byte count + verbatim body
    expect(screen.getByText(/COVER TERMS · 50 BYTES · VERBATIM/)).toBeTruthy();
    expect(docEl.closest('[data-slot="terms-document"]')).toBeTruthy();
    expect(fetchStub).toHaveBeenCalledWith(`${BASE}/domains/${DOMAIN_REF}`);
  });

  it("copy icon writes the full document to the clipboard, swaps to a check", async () => {
    fetchStub.mockResolvedValueOnce(response(200, DOC_TEXT));
    renderRawTab();
    await screen.findByText(/Pilot v1 mutual cover terms/);
    const copyButton = screen.getByRole("button", { name: "copy the cover terms" });
    expect(copyButton.querySelector(".lucide-copy")).toBeTruthy(); // icon, not the word
    fireEvent.click(copyButton);
    await waitFor(() => expect(copyButton.querySelector(".lucide-check")).toBeTruthy());
    expect(writeText).toHaveBeenCalledWith(DOC_TEXT);
  });

  it("404 renders the upload remedy (copy doc § anchored terms)", async () => {
    fetchStub.mockResolvedValueOnce(response(404));
    renderRawTab();
    expect(await screen.findByText("Not published yet.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Upload the cover terms" })).toBeTruthy();
  });

  it("unreachable: one honest line + Try again", async () => {
    fetchStub.mockRejectedValue(new TypeError("fetch failed")); // hook retries once — keep rejecting
    renderRawTab();
    expect(
      await screen.findByText("Couldn't reach the evidence server.", {}, { timeout: 4000 }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});

describe("raw policy tab — proof-mode PUT (HANSE §2)", () => {
  it("matching file PUTs to the derived ref with preimage + offset=23, then refetches", async () => {
    fetchStub.mockResolvedValueOnce(response(404)); // initial GET
    fetchStub.mockResolvedValueOnce(response(201)); // PUT
    fetchStub.mockResolvedValueOnce(response(200, DOC_TEXT)); // refetch
    renderRawTab();
    await screen.findByText("Not published yet.");
    pickFile(new File([DOC], "terms.md", { type: "text/markdown" }));
    await screen.findByText(/Pilot v1 mutual cover terms/);
    const [putUrl, putInit] = fetchStub.mock.calls[1] as [string, RequestInit];
    expect(putUrl).toBe(
      `${BASE}/domains/${DOMAIN_REF}?subaccord=${"1".repeat(32)}&preimage=${PREIMAGE}&offset=23`,
    );
    expect(putInit.method).toBe("PUT");
    expect(putInit.headers).toEqual({ "Content-Type": "text/markdown" });
    expect([...new Uint8Array(putInit.body as Uint8Array)]).toEqual([...DOC]);
  });

  it("wrong bytes never reach the server — hash mismatch is client-side", async () => {
    fetchStub.mockResolvedValueOnce(response(404));
    renderRawTab();
    await screen.findByText("Not published yet.");
    pickFile(new File(["not the anchored bytes"], "wrong.md", { type: "text/markdown" }));
    expect(
      await screen.findByText(
        "This file's hash doesn't match the mutual's policy hash. Nothing was uploaded.",
      ),
    ).toBeTruthy();
    expect(fetchStub).toHaveBeenCalledTimes(1); // the GET only
  });

  it("409 surfaces the stored-conflict line", async () => {
    fetchStub.mockResolvedValueOnce(response(404));
    fetchStub.mockResolvedValueOnce(response(409));
    renderRawTab();
    await screen.findByText("Not published yet.");
    pickFile(new File([DOC], "terms.md", { type: "text/markdown" }));
    expect(
      await screen.findByText("Different bytes are already stored at this anchor."),
    ).toBeTruthy();
  });
});
