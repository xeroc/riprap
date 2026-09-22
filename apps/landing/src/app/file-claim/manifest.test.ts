// Smoke: the §5 example round-trips to the exact documented bytes and the
// hash is the digest of those bytes. The full byte-stability suite is
// riprap-7qad's; this pins the layout the module promises.
import { describe, expect, it } from "vitest";
import { buildClaimManifest, type ClaimManifestInput } from "./manifest";

const INPUT = {
  dispute: "D".repeat(43),
  subaccord: "S".repeat(43),
  filer: "F".repeat(43),
  mutual: "F".repeat(43),
  member: "M".repeat(43),
  claim: "C".repeat(43),
  filedAt: "2026-11-15T19:42:00Z",
  title: "Payout request — knife assault, 2026-11-15",
  claimContext: {
    incidentAt: "2026-11-15T18:05:00Z",
    incidentPlace: "Olympia Conference Centre, Level 1, west corridor",
    requestedAmountUsdc: 2_000_000_000n,
    tier: "Standard",
    contributionUsdc: 20_000_000n,
  },
  entries: [
    { path: "01-ticket.pdf", sha256: "a".repeat(64) },
    { path: "02-id-document.jpg", sha256: "b".repeat(64) },
    { path: "03-police-report.pdf", sha256: "c".repeat(64) },
    { path: "04-medical-report.pdf", sha256: "d".repeat(64) },
    { path: "05-statutory-declaration.pdf", sha256: "e".repeat(64) },
  ],
} satisfies ClaimManifestInput;

const GOLDEN = `schema: riprap-claim/v1
dispute: ${INPUT.dispute}
subaccord: ${INPUT.subaccord}
filer: ${INPUT.filer}
mutual: ${INPUT.mutual}
member: ${INPUT.member}
claim: ${INPUT.claim}
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

describe("riprap-claim/v1 manifest", () => {
  it("serializes the CLAIM-WIZARD §5 example to the exact documented bytes", async () => {
    const built = await buildClaimManifest(INPUT);
    expect(built.yaml).toBe(GOLDEN);
  });

  it("hashes exactly those bytes (independent digest)", async () => {
    const built = await buildClaimManifest(INPUT);
    const digest = await globalThis.crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(GOLDEN),
    );
    const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
    expect(built.sha256Hex).toBe(hex);
  });

  it("rejects a non-canonical entry set (policy §7: incomplete is not adjudicated)", async () => {
    await expect(
      buildClaimManifest({ ...INPUT, entries: INPUT.entries.slice(0, 4) }),
    ).rejects.toThrow(/five canonical/);
  });
});
