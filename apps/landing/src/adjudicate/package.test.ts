// package.ts suite (riprap-6so0): the step-0 package contract
// (ADJUDICATION-DASHBOARD §5) — the riprap-claim/v1 parser pinned to the
// CLAIM-WIZARD §5 golden bytes (the claimant suite's GOLDEN is the
// cross-check), the root gate vs Dispute.evidenceHashes[round], the
// subaccord/filer cross-checks, and the honest-pending vs fails-closed
// vocabulary. fetch stubbed at the transport; the crypto is the real seam
// (the daemon's strict-mode construction recomposed, as in delivery.test.ts).

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
import { type DeliveredDocumentBundle, deliveryKeyDecrypt } from "./delivery";
import { fetchJurorPackage, parseClaimManifest } from "./package";

const DISPUTE = "D".repeat(32);
const JUROR = "J".repeat(32);
const ENDPOINT = "http://daemon.test";
const addr = (c: string) => c.repeat(43) as Address;

/** The CLAIM-WIZARD §5 worked example, numbers as sourced there:
 * $2,000 requested (2_000_000_000 micro) · Standard · $20 contribution. */
function exampleInput(over: Partial<ClaimManifestInput> = {}): ClaimManifestInput {
  return {
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
}

/** Byte-identical twin of the claimant suite's GOLDEN (manifest.test.ts) —
 * the CLAIM-WIZARD §5 worked example, the cross-check of record (spec §10). */
const GOLDEN = `schema: riprap-claim/v1
subaccord: ${addr("S")}
filer: ${addr("F")}
mutual: ${addr("F")}
member: ${addr("M")}
filed_at: 2026-11-15T19:42:00Z
language: en
title: "Payout request — knife assault, 2026-11-15"
claim_context:
  incident_at: 2026-11-15T18:05:00Z
  incident_place: "Olympia Conference Centre, Level 1, west corridor"
  requested_amount_usdc: 2000000000
  tier: Standard
  contribution_usdc: 20000000
options: { recipe: hanse-opt/v1, labels: ["Approve", "Deny"] }
entries:
  - { path: 01-ticket.pdf, sha256: "${"a".repeat(64)}" }
  - { path: 02-id-document.jpg, sha256: "${"b".repeat(64)}" }
  - { path: 03-police-report.pdf, sha256: "${"c".repeat(64)}" }
  - { path: 04-medical-report.pdf, sha256: "${"d".repeat(64)}" }
  - { path: 05-statutory-declaration.pdf, sha256: "${"e".repeat(64)}" }
`;

function utf8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

/** Encrypt exactly as the daemon's strict delivery does (ADR-0034): native
 * X25519 target key, unchanged construction + HKDF label. */
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
});

describe("parseClaimManifest — golden bytes (CLAIM-WIZARD §5; the claimant suite's GOLDEN)", () => {
  it("parses the §5 worked example into its exact input", () => {
    expect(parseClaimManifest(utf8(GOLDEN))).toEqual({ ...exampleInput(), language: "en" });
  });

  it("round-trips byte-exact through the claimant builder — parser and builder agree on every field", () => {
    expect(serializeClaimManifest(parseClaimManifest(utf8(GOLDEN)))).toBe(GOLDEN);
  });

  it("round-trips escaped free text (dq inverse: quotes, backslashes, newlines, tabs)", () => {
    const input = { ...exampleInput(), language: "en" };
    input.title = 'She said "knife" — \\ not a blade';
    input.claimContext.incidentPlace = "line one\nline two\ttabbed";
    const yaml = serializeClaimManifest(input);
    expect(parseClaimManifest(utf8(yaml))).toEqual(input);
    expect(serializeClaimManifest(parseClaimManifest(utf8(yaml)))).toBe(yaml);
  });

  it("fails closed on a foreign schema (the SDK's accord-evidence/v1 is not this profile)", () => {
    expect(() =>
      parseClaimManifest(utf8(GOLDEN.replace("riprap-claim/v1", "accord-evidence/v1"))),
    ).toThrow(/schema/);
  });

  it("fails closed on layout drift: missing trailing newline, trailing junk, uppercase leaf hex, swapped entry order", () => {
    expect(() => parseClaimManifest(utf8(GOLDEN.trimEnd()))).toThrow(/newline/);
    expect(() => parseClaimManifest(utf8(`${GOLDEN}extra: line\n`))).toThrow(/trailing/);
    expect(() => parseClaimManifest(utf8(GOLDEN.replace("a".repeat(64), "A".repeat(64))))).toThrow(
      /bad entry/,
    );
    const swapped = GOLDEN.replace(
      `  - { path: 01-ticket.pdf, sha256: "${"a".repeat(64)}" }\n  - { path: 02-id-document.jpg, sha256: "${"b".repeat(64)}" }`,
      `  - { path: 02-id-document.jpg, sha256: "${"b".repeat(64)}" }\n  - { path: 01-ticket.pdf, sha256: "${"a".repeat(64)}" }`,
    );
    expect(() => parseClaimManifest(utf8(swapped))).toThrow(/bad entry/);
  });

  it("fails closed on malformed free text: unknown escape, raw control character, non-UTF-8 bytes", () => {
    const badEscape = GOLDEN.replace(
      'title: "Payout request — knife assault, 2026-11-15"',
      'title: "bad \\q escape"',
    );
    expect(() => parseClaimManifest(utf8(badEscape))).toThrow(/unknown escape/);
    const controlChar = GOLDEN.replace(
      'title: "Payout request — knife assault, 2026-11-15"',
      'title: "ok\x01not ok"',
    );
    expect(() => parseClaimManifest(utf8(controlChar))).toThrow(/control character/);
    expect(() => parseClaimManifest(new Uint8Array([0xff, 0xfe, 0x00, 0x81]))).toThrow();
  });

  it("fails closed on a non-fixed options block (§5: recipe hanse-opt/v1, Approve=0/Deny=1)", () => {
    const tampered = GOLDEN.replace('labels: ["Approve", "Deny"]', 'labels: ["Yes", "No"]');
    expect(() => parseClaimManifest(utf8(tampered))).toThrow(/options/);
  });
});

describe("fetchJurorPackage (index → seam → root gate → parser → cross-checks)", () => {
  const key = newX25519KeyPair();
  const decrypt = deliveryKeyDecrypt(key.secret);
  const FILES = [{ path: "01-ticket.pdf", status: "stored" as const }];

  /** A 200 index delivering `manifest` for round 0, complete. */
  async function roundIndex(
    manifest: string,
    over: Record<string, unknown> = {},
  ): Promise<Response> {
    const bundle = await daemonDeliver(utf8(manifest), key.publicKey);
    return jsonResponse(200, {
      rounds: [{ round: 0, ...bundle, files: FILES, complete: true, ...over }],
    });
  }

  it("200 + complete + decrypt + root match + cross-checks → verified, bytes in memory", async () => {
    const fetchStub = vi.fn(async () => await roundIndex(GOLDEN));
    vi.stubGlobal("fetch", fetchStub);
    const result = await fetchJurorPackage({
      endpoint: `${ENDPOINT}/`,
      dispute: DISPUTE,
      juror: JUROR,
      round: 0,
      evidenceHash: await sha256(utf8(GOLDEN)),
      subaccord: addr("S"),
      mutual: addr("F"),
      decrypt,
    });
    expect(result.state).toBe("verified");
    if (result.state === "verified") {
      expect(new TextDecoder().decode(result.bytes)).toBe(GOLDEN);
      expect(result.manifest.subaccord).toBe(addr("S"));
      expect(result.manifest.claimContext.requestedAmountUsdc).toBe(2_000_000_000n);
      expect(result.files).toEqual(FILES);
    }
    // The ONLY daemon call is the juror index — the public manifest endpoint
    // is never on the juror path (§5).
    expect(fetchStub).toHaveBeenCalledTimes(1);
    expect(fetchStub).toHaveBeenCalledWith(`${ENDPOINT}/evidence/${DISPUTE}/for/${JUROR}`);
  });

  it("round missing from the index → pending (the claim stands, delivery retries — CLAIM-WIZARD §6)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(200, {
          rounds: [{ round: 2, out: "", operator_ephem_pub: "", files: [], complete: true }],
        }),
      ),
    );
    const result = await fetchJurorPackage({
      endpoint: ENDPOINT,
      dispute: DISPUTE,
      juror: JUROR,
      round: 0,
      evidenceHash: await sha256(utf8(GOLDEN)),
      subaccord: addr("S"),
      mutual: addr("F"),
      decrypt,
    });
    expect(result.state).toBe("pending");
  });

  it("complete: false → pending (jurors never see half a case)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => await roundIndex(GOLDEN, { complete: false })),
    );
    const result = await fetchJurorPackage({
      endpoint: ENDPOINT,
      dispute: DISPUTE,
      juror: JUROR,
      round: 0,
      evidenceHash: await sha256(utf8(GOLDEN)),
      subaccord: addr("S"),
      mutual: addr("F"),
      decrypt,
    });
    expect(result.state).toBe("pending");
  });

  it("maps 409 round-incomplete → pending; 5xx and transport failures → pending", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(409, { error: "round 0 incomplete: not all entries stored" })),
    );
    const incomplete = await fetchJurorPackage({
      endpoint: ENDPOINT,
      dispute: DISPUTE,
      juror: JUROR,
      round: 0,
      evidenceHash: await sha256(utf8(GOLDEN)),
      subaccord: addr("S"),
      mutual: addr("F"),
      decrypt,
    });
    expect(incomplete.state).toBe("pending");

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(503, { error: "unavailable" })),
    );
    const fiveHundred = await fetchJurorPackage({
      endpoint: ENDPOINT,
      dispute: DISPUTE,
      juror: JUROR,
      round: 0,
      evidenceHash: await sha256(utf8(GOLDEN)),
      subaccord: addr("S"),
      mutual: addr("F"),
      decrypt,
    });
    expect(fiveHundred.state).toBe("pending");

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      }),
    );
    const offline = await fetchJurorPackage({
      endpoint: ENDPOINT,
      dispute: DISPUTE,
      juror: JUROR,
      round: 0,
      evidenceHash: await sha256(utf8(GOLDEN)),
      subaccord: addr("S"),
      mutual: addr("F"),
      decrypt,
    });
    expect(offline.state).toBe("pending");
  });

  it("maps 404 and 409 tamper refusals → failed (terminal)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(404, { error: "juror not drawn for this dispute" })),
    );
    const notDrawn = await fetchJurorPackage({
      endpoint: ENDPOINT,
      dispute: DISPUTE,
      juror: JUROR,
      round: 0,
      evidenceHash: await sha256(utf8(GOLDEN)),
      subaccord: addr("S"),
      mutual: addr("F"),
      decrypt,
    });
    expect(notDrawn).toEqual({ state: "failed", reason: "juror not drawn for this dispute" });

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(409, { error: "stored manifest integrity gate failed (tampered)" }),
      ),
    );
    const tamper = await fetchJurorPackage({
      endpoint: ENDPOINT,
      dispute: DISPUTE,
      juror: JUROR,
      round: 0,
      evidenceHash: await sha256(utf8(GOLDEN)),
      subaccord: addr("S"),
      mutual: addr("F"),
      decrypt,
    });
    expect(tamper.state).toBe("failed");
  });

  it("maps a wrong-key decrypt (seam throws) → failed, never partial", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => await roundIndex(GOLDEN)),
    );
    const result = await fetchJurorPackage({
      endpoint: ENDPOINT,
      dispute: DISPUTE,
      juror: JUROR,
      round: 0,
      evidenceHash: await sha256(utf8(GOLDEN)),
      subaccord: addr("S"),
      mutual: addr("F"),
      decrypt: deliveryKeyDecrypt(newX25519KeyPair().secret),
    });
    expect(result.state).toBe("failed");
  });

  it("root gate mismatch (delivered bytes ≠ chain slot) → failed terminal do-not-vote", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => await roundIndex(GOLDEN)),
    );
    const result = await fetchJurorPackage({
      endpoint: ENDPOINT,
      dispute: DISPUTE,
      juror: JUROR,
      round: 0,
      evidenceHash: await sha256(utf8("a different manifest")),
      subaccord: addr("S"),
      mutual: addr("F"),
      decrypt,
    });
    expect(result).toEqual({
      state: "failed",
      reason: "root gate failed: sha256(manifest) != Dispute.evidence_hashes[round]",
    });
  });

  it("unparseable-but-root-matching plaintext → failed (root gate passes, parser refuses)", async () => {
    const garbage = "not a manifest at all\n";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => await roundIndex(garbage)),
    );
    const result = await fetchJurorPackage({
      endpoint: ENDPOINT,
      dispute: DISPUTE,
      juror: JUROR,
      round: 0,
      evidenceHash: await sha256(utf8(garbage)),
      subaccord: addr("S"),
      mutual: addr("F"),
      decrypt,
    });
    expect(result.state).toBe("failed");
    if (result.state === "failed") {
      expect(result.reason).toMatch(/manifest unparseable/);
    }
  });

  it("cross-check: manifest subaccord ≠ mutual subaccord → failed", async () => {
    const swapped = serializeClaimManifest(exampleInput({ subaccord: addr("X") }));
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => await roundIndex(swapped)),
    );
    const result = await fetchJurorPackage({
      endpoint: ENDPOINT,
      dispute: DISPUTE,
      juror: JUROR,
      round: 0,
      evidenceHash: await sha256(utf8(swapped)),
      subaccord: addr("S"),
      mutual: addr("F"),
      decrypt,
    });
    expect(result.state).toBe("failed");
    if (result.state === "failed") {
      expect(result.reason).toMatch(/manifest subaccord/);
    }
  });

  it("cross-check: manifest filer ≠ mutual PDA → failed", async () => {
    const swapped = serializeClaimManifest(exampleInput({ filer: addr("Z") }));
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => await roundIndex(swapped)),
    );
    const result = await fetchJurorPackage({
      endpoint: ENDPOINT,
      dispute: DISPUTE,
      juror: JUROR,
      round: 0,
      evidenceHash: await sha256(utf8(swapped)),
      subaccord: addr("S"),
      mutual: addr("F"),
      decrypt,
    });
    expect(result.state).toBe("failed");
    if (result.state === "failed") {
      expect(result.reason).toMatch(/manifest filer/);
    }
  });

  it("malformed index (not JSON / no rounds array) → failed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("not json", { status: 200 })),
    );
    const notJson = await fetchJurorPackage({
      endpoint: ENDPOINT,
      dispute: DISPUTE,
      juror: JUROR,
      round: 0,
      evidenceHash: await sha256(utf8(GOLDEN)),
      subaccord: addr("S"),
      mutual: addr("F"),
      decrypt,
    });
    expect(notJson.state).toBe("failed");

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(200, { rounds: "nope" })),
    );
    const noRounds = await fetchJurorPackage({
      endpoint: ENDPOINT,
      dispute: DISPUTE,
      juror: JUROR,
      round: 0,
      evidenceHash: await sha256(utf8(GOLDEN)),
      subaccord: addr("S"),
      mutual: addr("F"),
      decrypt,
    });
    expect(noRounds.state).toBe("failed");
  });

  it("zero-slot / absent evidence hash → no-evidence, and the daemon is never called", async () => {
    const fetchStub = vi.fn();
    vi.stubGlobal("fetch", fetchStub);
    const zero = await fetchJurorPackage({
      endpoint: ENDPOINT,
      dispute: DISPUTE,
      juror: JUROR,
      round: 0,
      evidenceHash: new Uint8Array(32),
      subaccord: addr("S"),
      mutual: addr("F"),
      decrypt,
    });
    expect(zero).toEqual({ state: "no-evidence" });
    const absent = await fetchJurorPackage({
      endpoint: ENDPOINT,
      dispute: DISPUTE,
      juror: JUROR,
      round: 0,
      evidenceHash: undefined,
      subaccord: addr("S"),
      mutual: addr("F"),
      decrypt,
    });
    expect(absent).toEqual({ state: "no-evidence" });
    expect(fetchStub).not.toHaveBeenCalled();
  });
});
