// doc.test.ts — the #/create doc core: canonical render determinism, the
// free-form body, the frontmatter machine block, the def validation matrix,
// and the client-side mirrors of every on-chain gate (initialize_mutual.rs —
// its own test vectors re-used where they exist).

import { describe, expect, it } from "vitest";

import { domainRefHex, sha256Hex } from "../pool/domainRef";
import {
  ACCORD_BOUNDS,
  type DefDoc,
  defaultAdvanced,
  defToOnChainTiers,
  hoursToSecs,
  isValidSlotPath,
  juryFeeMicro,
  renderDefDoc,
  slotPath,
  slugify,
  usdcToMicro,
  validateAdvanced,
  validateDef,
} from "./doc";

// ─── fixtures (data.ts provenance: prices from each pool's policy §5) ───────

/** Chairmageddon (mutual, data.ts § "chairmageddon" — Flat $10 / $40). */
function chairmageddon(): DefDoc {
  return {
    kind: "mutual",
    slug: "chairmageddon",
    name: "Chairmageddon",
    period: {
      start: "2026-11-15",
      end: "2026-11-17",
      claimsClose: "2026-11-24",
      venue: "Olympia Convention Centre, London",
    },
    tiers: [{ name: "Flat", fee: 10, cap: 40 }],
    proof: [
      {
        slot: "01-ticket.pdf",
        kind: "file",
        label: "your event ticket",
        verify: "in your own name",
      },
      {
        slot: "02-declaration.pdf",
        kind: "file",
        label: "your statutory declaration",
      },
    ],
    marketing: {
      blurb: "Every seat taken at the opening ceremony — and you stood the whole thing.",
      logo: "https://riprap.xyz/pools/chairmageddon/logo.svg",
    },
    language: "en",
    body: [
      "## What this pool covers",
      "",
      "Bodily injury from standing through the opening ceremony after every seat was taken.",
      "",
      "The cover needs the whole ceremony stood, start to finish.",
    ].join("\n"),
  };
}

/** Caffeine Supercycle (bounty, data.ts § "caffeine-supercycle" — Flat $5 / $50). */
function supercycle(): DefDoc {
  return {
    kind: "bounty",
    slug: "caffeine-supercycle",
    name: "Caffeine Supercycle",
    period: {
      start: "2026-11-15",
      end: "2026-11-17",
      claimsClose: "2026-11-24",
    },
    tiers: [{ name: "Flat", fee: 5, cap: 50 }],
    proof: [
      {
        slot: "01-recipient-post.url",
        kind: "url",
        label: "the recipient's confirmation post",
      },
      {
        slot: "02-photo.jpg",
        kind: "file",
        label: "the handover, hand to hand",
      },
    ],
    language: "en",
    body: [
      "## What this pool pays for",
      "",
      "Bring someone on the roster a hot drink they asked for — hand to hand, still hot, confirmed by them.",
      "",
      'Roster: Lily Liu, Anatoly "Toly" Yakovenko, Raj Gokal',
    ].join("\n"),
  };
}

const NOW = Date.parse("2026-10-15T00:00:00Z") / 1000;

function rejections(def: DefDoc, advanced = defaultAdvanced()): string[] {
  return [...validateDef(def), ...validateAdvanced(advanced, def, NOW)].map(
    (r) => `${r.field}: ${r.line}`,
  );
}

/** The body bytes after the closing frontmatter delimiter. */
function bodyOf(doc: string): string {
  return doc.slice(doc.indexOf("---\n\n") + 5);
}

// ─── render ─────────────────────────────────────────────────────────────────

describe("renderDefDoc", () => {
  it("renders byte-identical output for the same input (mutual + bounty)", () => {
    for (const def of [chairmageddon(), supercycle()]) {
      expect(renderDefDoc(def)).toBe(renderDefDoc(structuredClone(def)));
    }
  });

  it("emits the exact frontmatter machine block (milestone HANDOFF §2)", () => {
    const doc = renderDefDoc(chairmageddon());
    const front = doc.split("---\n")[1] ?? "";
    expect(front).toContain('schema: "riprap-def/v1"');
    expect(front).toContain('kind: "mutual"');
    expect(front.indexOf("slug:")).toBeLessThan(front.indexOf("name:"));
    expect(front.indexOf("period:")).toBeLessThan(front.indexOf("tiers:"));
    expect(front.indexOf("tiers:")).toBeLessThan(front.indexOf("proof:"));
    expect(front).toContain('claims_close: "2026-11-24"');
    expect(front).toContain('venue: "Olympia Convention Centre, London"');
    expect(front).toContain('logo: "https://riprap.xyz/pools/chairmageddon/logo.svg"');
    expect(front).toContain('language: "en"'); // canonical renderer always stamps it
  });

  it("renders the author's body verbatim after the frontmatter — no injected §s", () => {
    for (const def of [chairmageddon(), supercycle()]) {
      const doc = renderDefDoc(def);
      expect(bodyOf(doc)).toBe(`${def.body}\n`);
      expect(doc).not.toMatch(/^## \d+\. /m);
    }
  });

  it("accepts an empty body — the frontmatter is the whole document", () => {
    const def = chairmageddon();
    def.body = "";
    const doc = renderDefDoc(def);
    expect(bodyOf(doc)).toBe("");
    expect(doc.endsWith("---\n\n")).toBe(true);
  });

  it("normalizes CRLF and trims edge whitespace in the body only", () => {
    const def = chairmageddon();
    def.body = "  first\r\n\r\nsecond  \n";
    expect(bodyOf(renderDefDoc(def))).toBe("first\n\nsecond\n");
  });

  it("carries quotes in the body and in YAML scalars without corruption", () => {
    const def = chairmageddon();
    def.body = 'A "quoted" policy line.';
    expect(bodyOf(renderDefDoc(def))).toBe('A "quoted" policy line.\n');
    const front = renderDefDoc(def).split("---\n")[1] ?? "";
    expect(front).not.toContain('""Toly""');
  });
});

describe("anchors", () => {
  it("policy_hash = sha256(utf8(doc)); domain_ref = the subaccord derivation", async () => {
    const doc = renderDefDoc(chairmageddon());
    const bytes = new TextEncoder().encode(doc);
    const hash = await sha256Hex(bytes);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    const hashBytes = Uint8Array.from({ length: 32 }, (_, i) =>
      Number.parseInt(hash.slice(i * 2, i * 2 + 2), 16),
    );
    const ref = await domainRefHex(7n, hashBytes);
    expect(ref).toMatch(/^[0-9a-f]{64}$/);
    // pinned vector — any renderer change that moves the bytes moves this
    expect(hash).toBe("87a907b4ff1633a2720a558c744c6ef819898bbdce26d04a74ea169c788733db");
  });

  it("hashes the whole document — frontmatter and body both move the hash", async () => {
    const def = chairmageddon();
    const base = await sha256Hex(new TextEncoder().encode(renderDefDoc(def)));
    def.body = "different body";
    const bodyMoved = await sha256Hex(new TextEncoder().encode(renderDefDoc(def)));
    const renamed = chairmageddon();
    renamed.name = "Chairmageddon II";
    const frontMoved = await sha256Hex(new TextEncoder().encode(renderDefDoc(renamed)));
    expect(bodyMoved).not.toBe(base);
    expect(frontMoved).not.toBe(base);
  });
});

// ─── def validation matrix ──────────────────────────────────────────────────

describe("validateDef", () => {
  it("accepts both worked vectors", () => {
    // validateDef gates author → preview; the mint is a deploy prerequisite
    // (validateAdvanced carries it) — the worked vectors check the def alone.
    expect(validateDef(chairmageddon())).toEqual([]);
    expect(validateDef(supercycle())).toEqual([]);
  });

  it("never validates the body — empty and non-markdown bodies pass", () => {
    const def = chairmageddon();
    def.body = "  ";
    expect(rejections(def)).toEqual([]);
    def.body = "<script>alert(1)</script>";
    expect(rejections(def)).toEqual([]);
  });

  it("rejects a tier whose cap is below its fee, naming the tier", () => {
    const def = chairmageddon();
    def.tiers[0] = { name: "Flat", fee: 10, cap: 5 };
    expect(rejections(def)).toContainEqual(expect.stringMatching(/^tiers\.0\.cap: Tier 1/));
  });

  it("rejects a non-kebab slug", () => {
    const def = chairmageddon();
    def.slug = "Chairmageddon!";
    expect(rejections(def)).toContainEqual("slug: The slug is lowercase letters, digits, hyphens.");
  });

  it("rejects claims closing before coverage ends", () => {
    const def = chairmageddon();
    def.period.claimsClose = "2026-11-17";
    expect(rejections(def)).toContainEqual("period.claimsClose: Claims close after coverage ends.");
  });

  it("rejects a logo that is not an http(s) link", () => {
    const def = chairmageddon();
    if (def.marketing === undefined) throw new Error("fixture carries marketing");
    def.marketing.logo = "ipfs://not-here";
    expect(rejections(def)).toContainEqual(
      "marketing.logo: The logo is an image link — http(s) only.",
    );
  });

  it("rejects duplicate tier names and a proof-free pool", () => {
    const def = chairmageddon();
    def.tiers = [
      { name: "Flat", fee: 10, cap: 40 },
      { name: "flat", fee: 20, cap: 80 },
    ];
    expect(rejections(def)).toContainEqual("tiers: Tier names are unique.");
    def.proof = [];
    expect(rejections(def)).toContainEqual("proof: At least one proof slot.");
  });

  it("rejects slot paths outside the NN-name.ext grammar and mismatched kinds", () => {
    expect(isValidSlotPath("01-ticket.pdf", "file")).toBe(true);
    expect(isValidSlotPath("01-ticket.url", "url")).toBe(true);
    expect(isValidSlotPath("01-ticket.pdf", "url")).toBe(false);
    expect(isValidSlotPath("1-ticket.pdf", "file")).toBe(false);
    expect(isValidSlotPath("01-Ticket.pdf", "file")).toBe(false);
    const def = chairmageddon();
    def.proof[0] = { ...def.proof[0], slot: "01-ticket.txt", kind: "file" };
    expect(rejections(def)).toContainEqual(
      "proof: Slot 01-ticket.txt: file slots end .pdf/.jpg/.png, link slots end .url.",
    );
  });
});

// ─── on-chain gates, mirrored ───────────────────────────────────────────────

describe("validateAdvanced (initialize_mutual gates)", () => {
  it("rejects an even jury size", () => {
    const advanced = defaultAdvanced();
    advanced.minJurySize = 4;
    expect(rejections(chairmageddon(), advanced)).toContainEqual(
      "advanced.minJurySize: Must be odd.",
    );
  });

  it("rejects the ladder that overflows 31 jurors (J=5, appeals=3 → 47 > 31)", () => {
    const advanced = defaultAdvanced();
    advanced.minJurySize = 5;
    advanced.maxAppeals = 3;
    expect(rejections(chairmageddon(), advanced)).toContainEqual(
      "advanced.maxAppeals: The appeal ladder must fit 31 jurors.",
    );
  });

  it("accepts the §12 preset whole (mint set) and rejects appeals above the accord bound", () => {
    const preset = defaultAdvanced();
    preset.mint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"; // USDC (CLI README example)
    expect(rejections(chairmageddon(), preset)).toEqual([]);
    const overAppeals = defaultAdvanced();
    overAppeals.maxAppeals = ACCORD_BOUNDS.maxAppeals + 1;
    expect(rejections(chairmageddon(), overAppeals)).toContainEqual(
      "advanced.maxAppeals: The appeal ladder must fit 31 jurors.",
    );
  });

  it("rejects bps above 10000, windows at zero, appeals under an hour, draws outside 1–10", () => {
    const overBps = defaultAdvanced();
    overBps.alphaBps = 10_001;
    expect(rejections(chairmageddon(), overBps)).toContainEqual("advanced.alphaBps: 0–10000.");
    const revealOver = defaultAdvanced();
    revealOver.revealThresholdBps = 10_001;
    expect(rejections(chairmageddon(), revealOver)).toContainEqual(
      "advanced.revealThresholdBps: 0–10000.",
    );
    const zeroWindow = defaultAdvanced();
    zeroWindow.commitHours = 0;
    expect(rejections(chairmageddon(), zeroWindow)).toContainEqual(
      "advanced.reviewHours: Windows must be above zero.",
    );
    const shortAppeal = defaultAdvanced();
    shortAppeal.appealHours = 0.5;
    expect(rejections(chairmageddon(), shortAppeal)).toContainEqual(
      "advanced.appealHours: At least 1 hour.",
    );
    for (const attempts of [0, ACCORD_BOUNDS.maxDrawAttempts + 1]) {
      const draws = defaultAdvanced();
      draws.maxDrawAttempts = attempts;
      expect(rejections(chairmageddon(), draws)).toContainEqual("advanced.maxDrawAttempts: 1–10.");
    }
  });

  it("rejects doors that already opened and a non-pubkey mint", () => {
    const past = chairmageddon();
    past.period.start = "2026-01-01";
    expect(rejections(past)).toContainEqual(
      "period.start: Doors open in the future, claims close after them.",
    );
    const badMint = defaultAdvanced();
    badMint.mint = "not-a-pubkey";
    expect(rejections(chairmageddon(), badMint)).toContainEqual(
      "advanced.mint: A mint pubkey — classic SPL Token, no Token-2022.",
    );
  });
});

// ─── deploy-time derivations ────────────────────────────────────────────────

describe("derivations", () => {
  it("pads a 1-tier def to the on-chain [Tier; 3] by repeating its last tier", () => {
    const tiers = defToOnChainTiers(chairmageddon());
    expect(tiers).toHaveLength(3);
    expect(tiers.every((t) => t.contribution === 10_000_000n && t.maxPayout === 40_000_000n)).toBe(
      true,
    );
  });

  it("jury fee = min_jury_size × fee_per_juror (§12: 3 × $5 = $15 raw)", () => {
    expect(juryFeeMicro(defaultAdvanced())).toBe(15_000_000n);
  });

  it("unit conversions: whole USDC → micro, hours → seconds", () => {
    expect(usdcToMicro(10)).toBe(10_000_000n);
    expect(hoursToSecs(1.5)).toBe(5_400);
  });

  it("slot paths derive from row order and label", () => {
    expect(slotPath(0, "Your Event Ticket", "file")).toBe("01-your-event-ticket.pdf");
    expect(slotPath(11, "The Recipient's Confirmation", "url")).toBe(
      "12-the-recipient-s-confirmation.url",
    );
    expect(slugify("  Caffeine Supercycle — v2 ")).toBe("caffeine-supercycle-v2");
  });

  it("slugify folds accents and ligatures (best practice)", () => {
    expect(slugify("café über")).toBe("cafe-uber");
    expect(slugify("Müller Pööl")).toBe("muller-pool");
    expect(slugify("Straße")).toBe("strasse");
    expect(slugify("Ærø")).toBe("aero");
    expect(slugify("cœur")).toBe("coeur");
  });

  it("slugify collapses separators and trims edges", () => {
    expect(slugify("Mert of  the Year")).toBe("mert-of-the-year");
    expect(slugify("--NGMI_Hairline--")).toBe("ngmi-hairline");
    expect(slugify("Mert of the Year")).toBe("mert-of-the-year");
  });

  it("slugify yields the empty string when nothing is slugable", () => {
    expect(slugify("!!!")).toBe("");
    expect(slugify("———")).toBe("");
  });
});
