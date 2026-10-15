// doc.test.ts — the #/create doc core: canonical render determinism, the
// kind word-maps, the §5 tier table and §7 economics provenance, the def
// validation matrix, and the client-side mirrors of every on-chain gate
// (initialize_mutual.rs — its own test vectors re-used where they exist).

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
      { slot: "02-declaration.pdf", kind: "file", label: "your statutory declaration" },
    ],
    marketing: {
      blurb: "Every seat taken at the opening ceremony — and you stood the whole thing.",
    },
    language: "en",
    definition:
      "Bodily injury from standing through the opening ceremony after every seat was taken.\n\nThe cover needs the whole ceremony stood, start to finish.",
    exclusions: ["injuries you caused yourself", "seats given up voluntarily"],
    roster: "",
  };
}

/** Caffeine Supercycle (bounty, data.ts § "caffeine-supercycle" — Flat $5 / $50). */
function supercycle(): DefDoc {
  return {
    kind: "bounty",
    slug: "caffeine-supercycle",
    name: "Caffeine Supercycle",
    period: { start: "2026-11-15", end: "2026-11-17", claimsClose: "2026-11-24" },
    tiers: [{ name: "Flat", fee: 5, cap: 50 }],
    proof: [
      { slot: "01-recipient-post.url", kind: "url", label: "the recipient's confirmation post" },
      { slot: "02-photo.jpg", kind: "file", label: "the handover, hand to hand" },
    ],
    language: "en",
    definition:
      "Bring someone on the roster a hot drink they asked for — hand to hand, still hot, confirmed by them.",
    exclusions: ["drinks no longer hot at handover", "deliveries to people off the roster"],
    roster: 'Lily Liu, Anatoly "Toly" Yakovenko, Raj Gokal',
  };
}

const NOW = Date.parse("2026-10-15T00:00:00Z") / 1000;

function rejections(def: DefDoc, advanced = defaultAdvanced()): string[] {
  return [...validateDef(def), ...validateAdvanced(advanced, def, NOW)].map(
    (r) => `${r.field}: ${r.line}`,
  );
}

// ─── render ─────────────────────────────────────────────────────────────────

describe("renderDefDoc", () => {
  it("renders byte-identical output for the same input (mutual + bounty)", () => {
    for (const def of [chairmageddon(), supercycle()]) {
      expect(renderDefDoc(def, defaultAdvanced())).toBe(
        renderDefDoc(structuredClone(def), defaultAdvanced()),
      );
    }
  });

  it("emits the exact frontmatter machine block (milestone HANDOFF §2)", () => {
    const doc = renderDefDoc(chairmageddon(), defaultAdvanced());
    const front = doc.split("---\n")[1] ?? "";
    expect(front).toContain("schema: riprap-def/v1");
    expect(front).toContain("kind: mutual");
    expect(front.indexOf("slug:")).toBeLessThan(front.indexOf("name:"));
    expect(front.indexOf("period:")).toBeLessThan(front.indexOf("tiers:"));
    expect(front.indexOf("tiers:")).toBeLessThan(front.indexOf("proof:"));
    expect(front).toContain('claims_close: "2026-11-24"');
    expect(front).toContain('venue: "Olympia Convention Centre, London"');
    expect(front).not.toContain("language:"); // "en" is the default — omitted
  });

  it("§3 header and exclusions lead follow the kind word-map", () => {
    const mutualDoc = renderDefDoc(chairmageddon(), defaultAdvanced());
    const bountyDoc = renderDefDoc(supercycle(), defaultAdvanced());
    expect(mutualDoc).toContain("## 3. Covered event");
    expect(mutualDoc).toContain("Not covered:");
    expect(bountyDoc).toContain("## 3. Paid act");
    expect(bountyDoc).toContain("Not paid:");
    expect(bountyDoc).toContain("Roster:");
  });

  it("§5 tier table is verbatim from the doc's tiers", () => {
    const doc = renderDefDoc(chairmageddon(), defaultAdvanced());
    expect(doc).toContain("| Tier | Entry | Max payout |");
    expect(doc).toContain("| Flat | $10 | $40 |");
  });

  it("§7 prose embeds the chosen economics once (§12 preset: 3 × $5 = $15)", () => {
    const doc = renderDefDoc(chairmageddon(), defaultAdvanced());
    expect(doc).toContain("pre-pays an adjudication fee of $15 (3 jurors × $5)");
    expect(doc).toContain("review for 48 hours, commit for 12, reveal for 12");
    expect(doc).toContain("up to 2 appeals");
  });

  it("every doc carries the 11 fixed § headers", () => {
    for (const def of [chairmageddon(), supercycle()]) {
      const doc = renderDefDoc(def, defaultAdvanced());
      for (let section = 1; section <= 11; section++) {
        expect(doc).toMatch(new RegExp(`^## ${section}\\. `, "m"));
      }
    }
  });

  it("escapes double quotes in YAML scalars (roster with a nickname)", () => {
    const doc = renderDefDoc(supercycle(), defaultAdvanced());
    expect(doc).toContain("Roster:"); // body prose carries the roster verbatim
    expect(doc).not.toContain('""Toly""'); // no unescaped quote pairs anywhere
  });
});

describe("anchors", () => {
  it("policy_hash = sha256(utf8(doc)); domain_ref = the subaccord derivation", async () => {
    const doc = renderDefDoc(chairmageddon(), defaultAdvanced());
    const bytes = new TextEncoder().encode(doc);
    const hash = await sha256Hex(bytes);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    const hashBytes = Uint8Array.from({ length: 32 }, (_, i) =>
      Number.parseInt(hash.slice(i * 2, i * 2 + 2), 16),
    );
    const ref = await domainRefHex(7n, hashBytes);
    expect(ref).toMatch(/^[0-9a-f]{64}$/);
    // pinned vector — any renderer change that moves the bytes moves this
    expect(hash).toBe("ecc55d68f2e4cbc3a4ba366d3b2d390dc3bfc9babe71a0a70f63439dc79d2cb2");
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

  it("rejects an empty definition and an exclusion-free pool", () => {
    const def = chairmageddon();
    def.definition = "  ";
    def.exclusions = ["", " "];
    const lines = rejections(def);
    expect(lines).toContainEqual("definition: What does this pool cover?");
    expect(lines).toContainEqual("exclusions: At least one exclusion — no pool covers everything.");
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
});
