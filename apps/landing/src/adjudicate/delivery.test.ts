// delivery.ts vs stubbed fetch + the real noble stack — the juror transport
// contract (ADJUDICATION-DASHBOARD §5): the decrypt seam reproduces the
// daemon's strict-mode re-encryption byte-for-byte (composed here exactly as
// the daemon composes it: ephemeral X25519 + HKDF "accord-deliver-v1" +
// AES-GCM), the leaf gate fails closed, and the per-document state vocabulary
// is verified / pending / failed.
import {
  aesGcmEncrypt,
  DELIVER_INFO,
  hkdfSha256,
  newX25519KeyPair,
  sha256,
  x25519SharedSecret,
} from "@useaccord/sdk/evidence";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  currentDecryptDelivery,
  type DeliveredDocumentBundle,
  deliveryKeyDecrypt,
  fetchJurorDocument,
  localDeliveryKeyStore,
  verifyLeaf,
  ZERO_SHA256,
} from "./delivery";

const DISPUTE = "D".repeat(32);
const JUROR = "J".repeat(32);
const ENDPOINT = "http://daemon.test";

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

/** Encrypt exactly as the daemon's strict per-file delivery does (ADR-0034):
 * native X25519 target key, unchanged construction + HKDF label. */
async function daemonDeliver(
  plaintext: Uint8Array,
  deliveryKeyPub: Uint8Array,
): Promise<DeliveredDocumentBundle> {
  const ephem = newX25519KeyPair();
  const shared = x25519SharedSecret(ephem.secret, deliveryKeyPub);
  const kOut = await hkdfSha256(shared, new TextEncoder().encode(DELIVER_INFO));
  const out = await aesGcmEncrypt(kOut, plaintext);
  return { out: toBase64(out), operator_ephem_pub: toBase64(ephem.publicKey) };
}

async function leafHash(bytes: Uint8Array): Promise<string> {
  return Array.from(await sha256(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const DOCUMENT = new Uint8Array([0x25, 0x03, 0x19, 0x68, 0x00, 0xff]);

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("localDeliveryKeyStore + currentDecryptDelivery (the step 0 key gate)", () => {
  it("round-trips a 32-byte delivery key", () => {
    const store = localDeliveryKeyStore();
    const secret = newX25519KeyPair().secret;
    store.put(secret);
    expect(Array.from(store.get() ?? [])).toEqual(Array.from(secret));
    store.clear();
    expect(store.get()).toBeNull();
  });

  it("treats a malformed stored key as absent — custody fails closed", () => {
    localStorage.setItem("riprap.adjudicate.delivery-key", toBase64(new Uint8Array(8)));
    expect(localDeliveryKeyStore().get()).toBeNull();
  });

  it("returns null (no-delivery-key state) without a key, a decrypt seam with one", () => {
    const store = localDeliveryKeyStore();
    expect(currentDecryptDelivery(store)).toBeNull();
    store.put(newX25519KeyPair().secret);
    expect(currentDecryptDelivery(store)).toBeInstanceOf(Function);
  });
});

describe("deliveryKeyDecrypt (the seam — daemon construction, native X25519)", () => {
  it("reproduces the daemon's strict-mode re-encryption byte-for-byte", async () => {
    const key = newX25519KeyPair();
    const bundle = await daemonDeliver(DOCUMENT, key.publicKey);
    const bytes = await deliveryKeyDecrypt(key.secret)(bundle);
    expect(Array.from(bytes)).toEqual(Array.from(DOCUMENT));
  });

  it("throws for any other key (auth failure — tamper or stale key)", async () => {
    const key = newX25519KeyPair();
    const bundle = await daemonDeliver(DOCUMENT, key.publicKey);
    await expect(deliveryKeyDecrypt(newX25519KeyPair().secret)(bundle)).rejects.toThrow();
  });
});

describe("verifyLeaf (the leaf gate + skip rules)", () => {
  it("accepts the exact bytes and rejects any other", async () => {
    const sha = await leafHash(DOCUMENT);
    expect(await verifyLeaf(DOCUMENT, { path: "03-police-report.pdf", sha256: sha })).toBe(true);
    expect(
      await verifyLeaf(new Uint8Array([1, 2, 3]), { path: "03-police-report.pdf", sha256: sha }),
    ).toBe(false);
  });

  it("compares case-insensitively against the manifest's lowercase hex", async () => {
    expect(
      await verifyLeaf(DOCUMENT, { path: "p", sha256: (await leafHash(DOCUMENT)).toUpperCase() }),
    ).toBe(true);
  });

  it("URL-path entries and all-zero sentinels are born satisfied (§5 skip rules)", async () => {
    expect(await verifyLeaf(new Uint8Array([9, 9]), { path: "https://x/y" })).toBe(true);
    expect(
      await verifyLeaf(new Uint8Array([9, 9]), {
        path: "04-medical-report.pdf",
        sha256: ZERO_SHA256,
      }),
    ).toBe(true);
  });
});

describe("fetchJurorDocument (per-file GET → seam → leaf gate → state)", () => {
  const key = newX25519KeyPair();
  const decrypt = deliveryKeyDecrypt(key.secret);

  async function deliverDocument(): Promise<DeliveredDocumentBundle> {
    return await daemonDeliver(DOCUMENT, key.publicKey);
  }

  it("maps 200 + matching leaf → verified, with the plaintext bytes in memory", async () => {
    const bundle = await deliverDocument();
    const fetchStub = vi.fn(async () => jsonResponse(200, bundle));
    vi.stubGlobal("fetch", fetchStub);
    const result = await fetchJurorDocument({
      endpoint: `${ENDPOINT}/`,
      dispute: DISPUTE,
      juror: JUROR,
      round: 0,
      path: "03-police-report.pdf",
      decrypt,
      entry: { path: "03-police-report.pdf", sha256: await leafHash(DOCUMENT) },
    });
    expect(result.state).toBe("verified");
    if (result.state === "verified") {
      expect(Array.from(result.bytes)).toEqual(Array.from(DOCUMENT));
    }
    expect(fetchStub).toHaveBeenCalledWith(
      `${ENDPOINT}/evidence/${DISPUTE}/for/${JUROR}/0/03-police-report.pdf`,
    );
  });

  it("maps 200 + leaf mismatch → failed (terminal — fails closed)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(200, await deliverDocument())),
    );
    const result = await fetchJurorDocument({
      endpoint: ENDPOINT,
      dispute: DISPUTE,
      juror: JUROR,
      round: 0,
      path: "03-police-report.pdf",
      decrypt,
      entry: { path: "03-police-report.pdf", sha256: "a".repeat(64) },
    });
    expect(result).toEqual({
      state: "failed",
      reason: "leaf gate failed: sha256(document) != manifest entry",
    });
  });

  it("maps 409 round-incomplete → pending (honest, retryable — never an error)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(409, {
          error: 'round 0 incomplete: "03-police-report.pdf" not yet stored',
        }),
      ),
    );
    const result = await fetchJurorDocument({
      endpoint: ENDPOINT,
      dispute: DISPUTE,
      juror: JUROR,
      round: 0,
      path: "03-police-report.pdf",
      decrypt,
      entry: { path: "03-police-report.pdf", sha256: await leafHash(DOCUMENT) },
    });
    expect(result.state).toBe("pending");
  });

  it("maps 409 tamper / integrity refusals → failed (terminal)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(409, { error: "document undecryptable (tampered bundle)" })),
    );
    const result = await fetchJurorDocument({
      endpoint: ENDPOINT,
      dispute: DISPUTE,
      juror: JUROR,
      round: 0,
      path: "03-police-report.pdf",
      decrypt,
      entry: { path: "03-police-report.pdf" },
    });
    expect(result.state).toBe("failed");
  });

  it("maps 404 (not drawn / untracked path / no key server-side) → failed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(404, { error: "juror not drawn for this dispute" })),
    );
    const result = await fetchJurorDocument({
      endpoint: ENDPOINT,
      dispute: DISPUTE,
      juror: JUROR,
      round: 0,
      path: "03-police-report.pdf",
      decrypt,
      entry: { path: "03-police-report.pdf" },
    });
    expect(result.state).toBe("failed");
  });

  it("maps 5xx and transport failures → pending (retry; nothing ruled out)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(503, { error: "unavailable" })),
    );
    const fiveHundred = await fetchJurorDocument({
      endpoint: ENDPOINT,
      dispute: DISPUTE,
      juror: JUROR,
      round: 0,
      path: "03-police-report.pdf",
      decrypt,
      entry: { path: "03-police-report.pdf" },
    });
    expect(fiveHundred.state).toBe("pending");

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      }),
    );
    const offline = await fetchJurorDocument({
      endpoint: ENDPOINT,
      dispute: DISPUTE,
      juror: JUROR,
      round: 0,
      path: "03-police-report.pdf",
      decrypt,
      entry: { path: "03-police-report.pdf" },
    });
    expect(offline.state).toBe("pending");
  });

  it("maps a wrong-key decrypt (seam throws) → failed, never partial", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(200, await daemonDeliver(DOCUMENT, newX25519KeyPair().publicKey)),
      ),
    );
    const result = await fetchJurorDocument({
      endpoint: ENDPOINT,
      dispute: DISPUTE,
      juror: JUROR,
      round: 0,
      path: "03-police-report.pdf",
      decrypt,
      entry: { path: "03-police-report.pdf", sha256: await leafHash(DOCUMENT) },
    });
    expect(result.state).toBe("failed");
  });
});
