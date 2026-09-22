// evidence.ts vs stubbed fetch — the transport contract (ADR-0031): success,
// per-PUT retry on 5xx, 409 conflict surfaced (never retried, never
// overwritten). claimantEncrypt runs real (noble, pure JS) against a real
// 32-byte operator key — the wire body is a genuine ECIES bundle.
import { ed25519PublicKeyFromSeed } from "@useaccord/sdk/evidence";
import { afterEach, describe, expect, it, vi } from "vitest";
import { operatorPubFromKey, postManifest, putDocument } from "./evidence";

/** A real Ed25519 point (noble rejects arbitrary 32 bytes), as 64-hex. */
const OPERATOR_KEY = Array.from(ed25519PublicKeyFromSeed(new Uint8Array(32).fill(1)))
  .map((b) => b.toString(16).padStart(2, "0"))
  .join("");
const SUBACCORD = "S".repeat(32);
const DISPUTE = "D".repeat(32);

function jsonResponse(status: number): Response {
  return new Response(status === 201 ? "{}" : "conflict", { status });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("operatorPubFromKey", () => {
  it("decodes 64-hex keys to 32 bytes", () => {
    expect(operatorPubFromKey(OPERATOR_KEY)).toHaveLength(32);
    expect(operatorPubFromKey(OPERATOR_KEY)[0]).toBe(Number.parseInt(OPERATOR_KEY.slice(0, 2), 16));
  });
});

describe("postManifest", () => {
  it("POSTs the ECIES bundle to round 0 and maps 201 → posted", async () => {
    const fetchStub = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe(`https://op.example/evidence/${SUBACCORD}/${DISPUTE}/0`);
      expect(init?.method).toBe("POST");
      const body = JSON.parse(String(init?.body)) as Record<string, string>;
      for (const field of ["ct", "claimant_ephem_pub", "wrapped", "plaintext_hash"]) {
        expect(typeof body[field]).toBe("string");
        expect(body[field].length).toBeGreaterThan(0);
      }
      return jsonResponse(201);
    });
    vi.stubGlobal("fetch", fetchStub);
    const result = await postManifest({
      endpoint: "https://op.example/",
      subaccord: SUBACCORD,
      dispute: DISPUTE,
      manifest: new TextEncoder().encode("schema: riprap-claim/v1\n"),
      operatorPub: operatorPubFromKey(OPERATOR_KEY),
    });
    expect(result).toBe("posted");
    expect(fetchStub).toHaveBeenCalledTimes(1);
  });

  it("maps 409 → conflict (a different manifest is already stored)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(409)),
    );
    const result = await postManifest({
      endpoint: "https://op.example",
      subaccord: SUBACCORD,
      dispute: DISPUTE,
      manifest: new Uint8Array([1]),
      operatorPub: operatorPubFromKey(OPERATOR_KEY),
    });
    expect(result).toBe("conflict");
  });
});

describe("putDocument", () => {
  it("PUTs under the tracked path and maps 201 → delivered", async () => {
    const fetchStub = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe(
        `https://op.example/evidence/${SUBACCORD}/${DISPUTE}/0/01-ticket.pdf`,
      );
      expect(init?.method).toBe("PUT");
      return jsonResponse(201);
    });
    vi.stubGlobal("fetch", fetchStub);
    const result = await putDocument({
      endpoint: "https://op.example",
      subaccord: SUBACCORD,
      dispute: DISPUTE,
      path: "01-ticket.pdf",
      bytes: new Uint8Array([1, 2, 3]),
      operatorPub: operatorPubFromKey(OPERATOR_KEY),
    });
    expect(result).toBe("delivered");
    expect(fetchStub).toHaveBeenCalledTimes(1);
  });

  it("retries 5xx per-file, then succeeds on the next attempt", async () => {
    const statuses = [503, 500, 201];
    let call = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(statuses[call++] ?? 201)),
    );
    const result = await putDocument({
      endpoint: "https://op.example",
      subaccord: SUBACCORD,
      dispute: DISPUTE,
      path: "02-id-document.jpg",
      bytes: new Uint8Array([9]),
      operatorPub: operatorPubFromKey(OPERATOR_KEY),
    });
    expect(result).toBe("delivered");
    expect(call).toBe(3);
  });

  it("surfaces 409 as a terminal conflict — no retry, nothing overwritten", async () => {
    const fetchStub = vi.fn(async () => jsonResponse(409));
    vi.stubGlobal("fetch", fetchStub);
    const result = await putDocument({
      endpoint: "https://op.example",
      subaccord: SUBACCORD,
      dispute: DISPUTE,
      path: "03-police-report.pdf",
      bytes: new Uint8Array([7]),
      operatorPub: operatorPubFromKey(OPERATOR_KEY),
    });
    expect(result).toBe("conflict");
    expect(fetchStub).toHaveBeenCalledTimes(1);
  });
});
