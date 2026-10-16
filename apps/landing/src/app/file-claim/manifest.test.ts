// riprap-claim/v1 manifest suite (riprap-7qad): byte stability (the layout is
// part of the on-chain hash — CLAIM-WIZARD §5 "exact bytes, no
// canonicalization"), the five canonical policy §7 paths, sha256 provenance
// (evidence_hash = sha256(utf8(manifest.yaml))), the fixed option block, and
// trust-boundary validation. Sources cited per test.
import { describe, expect, it } from "vitest";
import { BLADE_POOL_FLOW } from "./flows/blade-pool";
import {
  buildClaimManifest,
  type ClaimManifestInput,
  type ManifestSlot,
  serializeClaimManifest,
  sha256Hex,
} from "./manifest";

/** The blade pack's canonical proof paths — the §5 worked example's slot
 *  list, threaded explicitly now that no default exists (de-blading). */
const BLADE_PATHS = BLADE_POOL_FLOW.documentSlots.map((s) => s.path);
/** Every blade-vector call in this suite serializes with the pack's slots. */
const serializeBlade = (over: Partial<ClaimManifestInput> = {}) =>
  serializeClaimManifest(exampleInput(over), BLADE_PATHS);
const buildBlade = (over: Partial<ClaimManifestInput> = {}) =>
  buildClaimManifest(exampleInput(over), BLADE_PATHS);

const addr = (c: string) => c.repeat(43);

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
    entries: BLADE_PATHS.map((path, i) => ({
      path,
      sha256: String.fromCharCode(97 + i).repeat(64),
    })),
    ...over,
  };
}

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

describe("riprap-claim/v1 — byte stability (CLAIM-WIZARD §5: the layout is the hash)", () => {
  it("serializes the §5 worked example to the exact documented bytes", () => {
    expect(serializeBlade()).toBe(GOLDEN);
  });

  it("is deterministic across builds — recovery re-hashes months later", async () => {
    const first = await buildBlade();
    const second = await buildBlade();
    expect(second.yaml).toBe(first.yaml);
    expect(second.sha256Hex).toBe(first.sha256Hex);
  });

  it("ends with a single trailing newline — nothing else after the last entry", () => {
    const yaml = serializeBlade();
    expect(yaml.endsWith("}\n")).toBe(true);
    expect(yaml.endsWith("}\n\n")).toBe(false);
  });

  it("micro-USDC amounts render as unsuffixed integers (§5: 2000000000 = $2,000)", () => {
    const yaml = serializeBlade({
      claimContext: {
        ...exampleInput().claimContext,
        requestedAmountUsdc: 4_000_000_000n,
        contributionUsdc: 40_000_000n,
      },
    });
    expect(yaml).toContain("requested_amount_usdc: 4000000000");
    expect(yaml).toContain("contribution_usdc: 40000000");
  });

  it("free text escapes YAML double-quote specials and stays stable", () => {
    const input = exampleInput({
      title: 'He said "run" \\ fast',
      claimContext: { ...exampleInput().claimContext, incidentPlace: 'Level 1, "west" corridor' },
    });
    const yaml = serializeClaimManifest(input, BLADE_PATHS);
    expect(yaml).toContain('title: "He said \\"run\\" \\\\ fast"');
    expect(serializeClaimManifest(input, BLADE_PATHS)).toBe(yaml); // same input, same bytes
  });
});

describe("riprap-claim/v1 — the five canonical policy §7 paths", () => {
  it("carries exactly the policy §7 proof list, in policy order", () => {
    expect([...BLADE_PATHS]).toEqual([
      "01-ticket.pdf",
      "02-id-document.jpg",
      "03-police-report.pdf",
      "04-medical-report.pdf",
      "05-statutory-declaration.pdf",
    ]);
  });

  it("rejects an incomplete set (policy §7: not adjudicated)", () => {
    expect(() => serializeBlade({ entries: exampleInput().entries.slice(0, 4) })).toThrow(
      /canonical policy §7 paths/,
    );
  });

  it("rejects an unknown path (ADR-0031: untracked path is a daemon 400)", () => {
    const entries = exampleInput().entries;
    // the cast IS the attack: an untyped caller smuggling a foreign path in
    const forged = {
      path: "06-extra.pdf",
      sha256: "a".repeat(64),
    } as unknown as ClaimManifestInput["entries"][number];
    expect(() => serializeBlade({ entries: [...entries.slice(0, 4), forged] })).toThrow(
      /canonical policy §7 paths/,
    );
  });

  it("rejects reordered entries — policy order is the canonical order", () => {
    const entries = exampleInput().entries;
    const swapped = [entries[1], entries[0], entries[2], entries[3], entries[4]];
    expect(() => serializeBlade({ entries: swapped })).toThrow(/canonical policy §7 paths/);
  });

  it("rejects a leaf hash that is not 64 lower-case hex", () => {
    const entries = exampleInput().entries;
    expect(() =>
      serializeBlade({ entries: entries.map((e, i) => (i === 2 ? { ...e, sha256: "XYZ" } : e)) }),
    ).toThrow(/64-hex/);
  });
});

describe("riprap-claim/v1 — sha256 provenance (evidence_hash = sha256(utf8(manifest.yaml)))", () => {
  it("hashes exactly the serialized bytes — independent digest equality", async () => {
    const built = await buildBlade();
    expect(built.sha256Hex).toBe(await sha256Hex(new TextEncoder().encode(built.yaml)));
    expect(built.sha256Hex).toMatch(/^[0-9a-f]{64}$/);
  });

  it("any changed field changes the hash — the manifest is the commitment", async () => {
    const base = await buildBlade();
    const leafs = exampleInput().entries;
    const variants: ClaimManifestInput[] = [
      exampleInput({ title: "Payout request — knife assault, 2026-11-16" }),
      exampleInput({
        claimContext: { ...exampleInput().claimContext, requestedAmountUsdc: 1_000_000_000n },
      }),
      exampleInput({
        entries: leafs.map((e, i) => (i === 0 ? { ...e, sha256: "f".repeat(64) } : e)),
      }),
      exampleInput({ subaccord: addr("E") }),
    ];
    const hashes = await Promise.all(variants.map((v) => buildClaimManifest(v, BLADE_PATHS)));
    for (const h of hashes) {
      expect(h.sha256Hex).not.toBe(base.sha256Hex);
    }
    expect(new Set(hashes.map((h) => h.sha256Hex)).size).toBe(variants.length);
  });
});

describe("riprap-claim/v1 — the fixed option block (EVENT-MUTUAL: Approve=0, Deny=1, no filer salt)", () => {
  it("renders recipe hanse-opt/v1 with labels Approve, Deny — byte-exact, caller-independent", () => {
    const yaml = serializeBlade();
    expect(yaml).toContain('options: { recipe: hanse-opt/v1, labels: ["Approve", "Deny"] }');
    // the block is fixed: the input type has no options field to vary
    expect("options" in exampleInput()).toBe(false);
  });
});
describe("riprap-claim/v1 — url-slot entries (the raw link rides the manifest)", () => {
  const url = "https://x.com/Toly/status/1847000000000000000";
  const slots: readonly ManifestSlot[] = [
    { path: "01-ticket.pdf" },
    { path: "02-id-document.jpg" },
    { path: "03-request-evidence.png" },
    { path: "04-delivery-evidence.jpg" },
    { path: "05-confirmation.url", url: "url" },
  ];

  function urlInput(over: Partial<ClaimManifestInput> = {}): ClaimManifestInput {
    const entries: ClaimManifestInput["entries"] = [
      { path: "01-ticket.pdf", sha256: "a".repeat(64) },
      { path: "02-id-document.jpg", sha256: "b".repeat(64) },
      { path: "03-request-evidence.png", sha256: "c".repeat(64) },
      { path: "04-delivery-evidence.jpg", sha256: "d".repeat(64) },
      { url, sha256: "e".repeat(64) },
    ];
    return exampleInput({ entries, ...over });
  }

  it("serializes the url slot as a URL-path entry — the RAW link as the path, no key form", () => {
    const yaml = serializeClaimManifest(urlInput(), slots);
    expect(yaml).toContain(`  - { path: "${url}", sha256: "${"e".repeat(64)}" }`);
    expect(yaml).not.toContain("confirmation-url");
    expect(yaml).not.toContain("05-confirmation.url");
  });

  it("the url entry's sha256 is the hash of the link's UTF-8 bytes — the same value intakeUrl computes", async () => {
    const built = await buildClaimManifest(
      urlInput({
        entries: [
          ...urlInput().entries.slice(0, 4),
          { url, sha256: await sha256Hex(new TextEncoder().encode(url)) },
        ],
      }),
      slots,
    );
    expect(built.yaml).toContain(`path: "${url}"`);
  });

  it("rejects a path entry where the slot is a url slot — the raw link is required", () => {
    const forged = {
      path: "05-confirmation.url",
      sha256: "e".repeat(64),
    } as unknown as ClaimManifestInput["entries"][number];
    expect(() =>
      serializeClaimManifest(
        urlInput({ entries: [...urlInput().entries.slice(0, 4), forged] }),
        slots,
      ),
    ).toThrow(/needs the raw URL/);
  });

  it("rejects a url entry where the slot is a file slot — files keep their canonical paths", () => {
    const swapped = [
      { url, sha256: "a".repeat(64) },
      ...urlInput().entries.slice(1),
    ] as ClaimManifestInput["entries"];
    expect(() => serializeClaimManifest(urlInput({ entries: swapped }), slots)).toThrow(
      /canonical policy §7 paths/,
    );
  });

  it("rejects an empty url — an unset link is not a proof", () => {
    expect(() =>
      serializeClaimManifest(
        urlInput({
          entries: [...urlInput().entries.slice(0, 4), { url: "  ", sha256: "e".repeat(64) }],
        }),
        slots,
      ),
    ).toThrow(/needs the raw URL/);
  });
});
describe("riprap-claim/v1 — trust-boundary validation", () => {
  it("rejects a non-base58 address", () => {
    expect(() => serializeBlade({ subaccord: "0ops" })).toThrow(/subaccord is not a base58/);
  });

  it("rejects a non-UTC-ISO timestamp", () => {
    expect(() => serializeBlade({ filedAt: "2026-11-15 19:42:00" })).toThrow(/ISO 8601 UTC/);
    expect(() =>
      serializeBlade({
        claimContext: { ...exampleInput().claimContext, incidentAt: "2026-11-15T18:05:00+01:00" },
      }),
    ).toThrow(/ISO 8601 UTC/);
  });

  it("rejects control characters in member-typed free text", () => {
    // \n, \r, \t escape (valid YAML); other controls are refused outright
    expect(() => serializeBlade({ title: "bad\u0007beep" })).toThrow(/control characters/);
  });
});
