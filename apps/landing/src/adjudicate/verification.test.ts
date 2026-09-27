// verification.test.ts — the step-0 gate matrix in one place (riprap-7la5,
// HANDOFF §6 rows 2–3, spec §5): the composed contract across package.ts +
// delivery.ts with the REAL crypto seam — tampered manifest → terminal
// do-not-vote with no document stage, incomplete round → honest pending
// then verified on retry, leaf gates over the golden manifest, and the
// no-delivery-key honest state. The unit-level rows (leaf skip rules,
// per-status mappings, cross-check failures, zero-slot) live in
// delivery.test.ts (riprap-n8cx) and package.test.ts (riprap-6so0); this
// suite composes them and pins the retry + no-document-rendering behavior.

import type { Address } from "@solana/kit";
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
  CLAIM_DOCUMENT_PATHS,
  type ClaimManifestInput,
  serializeClaimManifest,
} from "../app/file-claim/manifest";
import {
  currentDecryptDelivery,
  type DeliveredDocumentBundle,
  deliveryKeyDecrypt,
  fetchJurorDocument,
  localDeliveryKeyStore,
} from "./delivery";
import { fetchJurorPackage, type PackageVerification } from "./package";

const DISPUTE = "D".repeat(32);
const JUROR = "J".repeat(32);
const ENDPOINT = "http://daemon.test";
const SUBACCORD = "S".repeat(43) as Address;
const MUTUAL = "F".repeat(43) as Address;

const addr = (c: string) => c.repeat(43);

/** The CLAIM-WIZARD §5 worked example (the golden manifest, byte-stable via
 * the claimant builder — same fixture contract as package.test.ts). */
function exampleManifest(over: Partial<ClaimManifestInput> = {}): string {
  const input: ClaimManifestInput = {
    subaccord: addr("S"),
    filer: addr("F"),
    mutual: addr("F"),
    member: addr("M"),
    filedAt: "2026-11-15T19:42:00Z",
    title: "Payout request — knife assault, 2026-11-15",
    claimContext: {
      incidentAt: "2026-11-15T18:05:00Z",
      incidentPlace: "Olympia Conference Centre, Level 1, west corridor",
      requestedAmountUsdc: 2_000_000_000n,
      tier: "Standard",
      contributionUsdc: 20_000_000n,
    },
    entries: CLAIM_DOCUMENT_PATHS.map((path, i) => ({
      path,
      sha256: String.fromCharCode(97 + i).repeat(64),
    })),
    ...over,
  };
  return serializeClaimManifest(input);
}

const GOLDEN = exampleManifest();

function utf8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

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

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("HANDOFF §6 row 2 — tampered manifest bytes → terminal do-not-vote, no document renders", () => {
  it("delivered bytes that hash off the chain root fail the root gate; the document route is never touched", async () => {
    const key = newX25519KeyPair();
    const tampered = utf8(`${GOLDEN}tampered: true\n`);
    const bundle = await daemonDeliver(tampered, key.publicKey);
    const fetchStub = vi.fn(async () =>
      jsonResponse(200, {
        rounds: [{ round: 0, ...bundle, files: [], complete: true }],
      }),
    );
    vi.stubGlobal("fetch", fetchStub);

    const result = await fetchJurorPackage({
      endpoint: ENDPOINT,
      dispute: DISPUTE,
      juror: JUROR,
      round: 0,
      evidenceHash: await sha256(utf8(GOLDEN)), // the on-chain root — the TRUE bytes
      subaccord: SUBACCORD,
      mutual: MUTUAL,
      decrypt: deliveryKeyDecrypt(key.secret),
    });

    expect(result).toEqual({
      state: "failed",
      reason: "root gate failed: sha256(manifest) != Dispute.evidence_hashes[round]",
    });
    // no document stage ran: the only daemon call is the juror index — the
    // per-file route is gated behind a verified package (spec §4).
    expect(fetchStub).toHaveBeenCalledTimes(1);
  });

  it("a verified package is the only state that yields document slots — failed/pending map to none", async () => {
    // The shell's gate, stated as data: slots exist only for `verified`.
    const slotsOf = (v: PackageVerification) => (v.state === "verified" ? v.manifest.entries : []);
    expect(slotsOf({ state: "failed", reason: "x" })).toHaveLength(0);
    expect(slotsOf({ state: "pending", reason: "x" })).toHaveLength(0);
    expect(slotsOf({ state: "no-evidence" })).toHaveLength(0);
  });
});

describe("HANDOFF §6 row 3 — incomplete round → honest pending, retried, then verified", () => {
  it("409 round-incomplete → pending; the retried fetch lands complete → verified", async () => {
    const key = newX25519KeyPair();
    const bundle = await daemonDeliver(utf8(GOLDEN), key.publicKey);
    const fetchStub = vi
      .fn()
      .mockReturnValueOnce(
        Promise.resolve(
          jsonResponse(409, { error: 'round 0 incomplete: "03-police-report.pdf" not yet stored' }),
        ),
      )
      .mockReturnValueOnce(
        Promise.resolve(
          jsonResponse(200, {
            rounds: [
              {
                round: 0,
                ...bundle,
                files: [{ path: "03-police-report.pdf", status: "stored" }],
                complete: true,
              },
            ],
          }),
        ),
      );
    vi.stubGlobal("fetch", fetchStub);

    const params = {
      endpoint: ENDPOINT,
      dispute: DISPUTE,
      juror: JUROR,
      round: 0,
      evidenceHash: await sha256(utf8(GOLDEN)),
      subaccord: SUBACCORD,
      mutual: MUTUAL,
      decrypt: deliveryKeyDecrypt(key.secret),
    };
    const first = await fetchJurorPackage(params);
    expect(first.state).toBe("pending"); // honest, never an error — jurors never see half a case

    const retry = await fetchJurorPackage(params);
    expect(retry.state).toBe("verified");
    expect(fetchStub).toHaveBeenCalledTimes(2);
  });
});

describe("leaf gates over the golden manifest — one tampered document is terminal (spec §5)", () => {
  const key = newX25519KeyPair();

  it("every entry verifies when the bytes hash to its recorded sha256", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(200, await daemonDeliver(utf8("document bytes"), key.publicKey)),
      ),
    );
    const results = await Promise.all(
      CLAIM_DOCUMENT_PATHS.map(async (path) =>
        fetchJurorDocument({
          endpoint: ENDPOINT,
          dispute: DISPUTE,
          juror: JUROR,
          round: 0,
          path,
          decrypt: deliveryKeyDecrypt(key.secret),
          entry: { path, sha256: await sha256HexOf(utf8("document bytes")) },
        }),
      ),
    );
    expect(results.every((r) => r.state === "verified")).toBe(true);
  });

  it("one swapped document fails its leaf gate — terminal, fails closed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(200, await daemonDeliver(utf8("other bytes"), key.publicKey))),
    );
    const result = await fetchJurorDocument({
      endpoint: ENDPOINT,
      dispute: DISPUTE,
      juror: JUROR,
      round: 0,
      path: "03-police-report.pdf",
      decrypt: deliveryKeyDecrypt(key.secret),
      entry: { path: "03-police-report.pdf", sha256: await sha256HexOf(utf8("document bytes")) },
    });
    expect(result).toEqual({
      state: "failed",
      reason: "leaf gate failed: sha256(document) != manifest entry",
    });
  });
});

describe("no delivery key in this browser — the honest step-0 key gate (spec §5/§9)", () => {
  it("no key → no decrypt seam, and the seam returns once a key is registered", async () => {
    const store = localDeliveryKeyStore();
    expect(currentDecryptDelivery(store)).toBeNull();

    const key = newX25519KeyPair();
    store.put(key.secret);
    const decrypt = currentDecryptDelivery(store);
    expect(decrypt).toBeInstanceOf(Function);

    // the registered seam actually decrypts a delivered bundle
    const bundle = await daemonDeliver(utf8(GOLDEN), key.publicKey);
    expect(new TextDecoder().decode(await (decrypt as NonNullable<typeof decrypt>)(bundle))).toBe(
      GOLDEN,
    );
  });
});

async function sha256HexOf(bytes: Uint8Array): Promise<string> {
  return Array.from(await sha256(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}
