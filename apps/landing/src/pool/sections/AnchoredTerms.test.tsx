// The anchored-terms band against the evidence daemon's domain-CAS contract
// (SPEC.md §HTTP API, HANSE_DOMAIN_SPEC_UPLOAD §2/§4): GET by derived
// domain_ref, 404 → upload remedy, hash-gated proof-mode PUT. The mutual is
// mocked to the worked vector (seed 1, policy_hash d5756c2e… → domain_ref
// f76adcdd…), so URL assertions double as derivation assertions. fetch is
// stubbed — no network in jsdom.

import type { Mutual } from "@riprap/hanse";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeMutual } from "../fixtures";
import { type MutualQuery, useMutual } from "../useMutual";
import { AnchoredTerms } from "./AnchoredTerms";

vi.mock("../useMutual", () => ({ useMutual: vi.fn() }));
const mutualMock = vi.mocked(useMutual);

const BASE = "http://evidence.test";
const POLICY_HASH = "d5756c2e6ec42a9a557da82b0ac7000a7c0e613f997fb822407c7a43801172b4";
const DOMAIN_REF = "f76adcdd011256053753e5f5c9a4f73bca8645fdb8b566ef8c3a431085ec686e";
const PREIMAGE =
  "68616e73653a7375626163636f72640100000000000000" +
  "d5756c2e6ec42a9a557da82b0ac7000a7c0e613f997fb822407c7a43801172b4";

const DOC = new TextEncoder().encode("# Hanse Cover Terms\n\nPilot v1 mutual cover terms.\n");
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

function response(status: number, body?: string): Response {
  return new Response(body ?? null, { status });
}

function renderBand() {
  vi.stubEnv("VITE_EVIDENCE_URL", BASE);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AnchoredTerms />
    </QueryClientProvider>,
  );
}

function pickFile(file: File) {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [file] } });
}

beforeEach(() => {
  mutualMock.mockReturnValue(READY);
  vi.stubGlobal("fetch", fetchStub);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  fetchStub.mockReset();
  mutualMock.mockReset();
});

describe("anchored terms — GET by derived domain_ref (HANSE §4 vector)", () => {
  it("serves the doc: stamp carries policy hash + domain ref, body verbatim", async () => {
    fetchStub.mockResolvedValueOnce(
      response(200, "# Hanse Cover Terms\n\nPilot v1 mutual cover terms.\n"),
    );
    renderBand();
    await screen.findByText(/Pilot v1 mutual cover terms/);
    expect(screen.getByText(/POLICY HASH d5756c2e/).textContent).toContain(
      `DOMAIN REF ${DOMAIN_REF}`,
    );
    expect(fetchStub).toHaveBeenCalledWith(`${BASE}/domains/${DOMAIN_REF}`);
  });

  it("404 renders the upload remedy (copy doc § anchored terms band)", async () => {
    fetchStub.mockResolvedValueOnce(response(404));
    renderBand();
    expect(await screen.findByText("Not published yet.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Upload the cover terms" })).toBeTruthy();
  });

  it("unreachable: one honest line + Try again", async () => {
    fetchStub.mockRejectedValue(new TypeError("fetch failed")); // hook retries once — keep rejecting
    renderBand();
    expect(
      await screen.findByText("Couldn't reach the evidence server.", {}, { timeout: 4000 }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});

describe("anchored terms — proof-mode PUT (HANSE §2)", () => {
  it("matching file PUTs to the derived ref with preimage + offset=23, then refetches", async () => {
    fetchStub.mockResolvedValueOnce(response(404)); // initial GET
    fetchStub.mockResolvedValueOnce(response(201)); // PUT
    fetchStub.mockResolvedValueOnce(
      response(200, "# Hanse Cover Terms\n\nPilot v1 mutual cover terms.\n"),
    ); // refetch
    renderBand();
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
    renderBand();
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
    renderBand();
    await screen.findByText("Not published yet.");
    pickFile(new File([DOC], "terms.md", { type: "text/markdown" }));
    expect(
      await screen.findByText("Different bytes are already stored at this anchor."),
    ).toBeTruthy();
  });
});
