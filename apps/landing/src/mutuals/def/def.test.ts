// riprap-def/v1 — the format suite (milestone riprap-9bh4 HANDOFF §6,
// rows 1–2): determinism, the free-form body, the frontmatter grammar and
// validation matrix (one rejection path per HANDOFF §3/§6 rule), and the
// render → parse round-trip.
//
// Vector facts and their sources (all final, 2026-10-07/2026-10-13):
// - Chairmageddon — mutuals/data.ts §5 comment + Micro Mutual —
//   Chairmageddon - Policy.md §2/§3/§5: Flat $10 entry, up to $40
//   payout; payout requests close 10 days after the conference ends
//   (§2) → 2026-11-27; venue Olympia (§2 example block).
// - Caffeine Supercycle — mutuals/data.ts §5 comment + Micro Bounty —
//   Caffeine Supercycle - Terms.md §2/§3/§5: Flat $5 entry, up to $50
//   bounty; claim window closes 10 days after the conference ends (§2)
//   → 2026-11-27; roster Lily/Toly/Raj (§3).
import { describe, expect, it } from "vitest";
import { type DefInput, renderDef } from "./render";
import type { DefFrontmatter, DefProofSlot } from "./schema";
import { DefFormatError, parseDefDoc, parseFrontmatter, splitDefDocument } from "./schema";
import { validateDefArtifact, validateFrontmatter } from "./validate";

const chairmageddon: DefInput = {
  kind: "mutual",
  slug: "chairmageddon",
  name: "Chairmageddon",
  period: {
    start: "2026-11-15",
    end: "2026-11-17",
    claims_close: "2026-11-27", // policy §2: 10 days after the conference ends
    venue: "Olympia Convention Centre, London",
  },
  tiers: [{ name: "Flat", fee: 10, cap: 40 }], // policy §5
  proof: [
    {
      slot: "01-ticket.pdf",
      kind: "file",
      label: "Ticket",
      verify:
        "evidence of a valid ticket for the covered event, issued in the requester's own name",
    },
    {
      slot: "02-id-document.jpg",
      kind: "file",
      label: "Identity documentation",
    },
    {
      slot: "03-capacity-evidence.pdf",
      kind: "file",
      label: "Capacity evidence",
    },
    {
      slot: "04-standing-evidence.jpg",
      kind: "file",
      label: "Standing evidence",
    },
  ],
  marketing: {
    event: "Breakpoint 2026",
    blurb: "Every seat taken at the opening ceremony — and you stood the whole thing.",
    logo: "https://riprap.xyz/pools/chairmageddon/logo.svg",
    share: "Standing through the opening ceremony at Breakpoint — worth $40.",
    smallestPayout: 40, // data.ts §5: the flat $40 payout is the only success payment
  },
  language: "en",
  body: [
    "## Covered event",
    "",
    "At the opening ceremony of the covered event, every seat in the ceremony venue was occupied, and the member stood — on their feet, without a seat — for the entire opening ceremony, from its published start to its published end.",
    "",
    "- **Seat** — a thing designed to be sat on, provided by the venue, and occupied by somebody else. Stairs are not seats. The floor is not a seat.",
    "",
    "## Exclusions",
    "",
    "- Seats available when the member arrived. Elective standing is a lifestyle, not a peril.",
    "- Members who sat at any point during the ceremony — on a seat, on the floor, on steps, or on another person.",
  ].join("\n"),
};

const caffeine: DefInput = {
  kind: "bounty",
  slug: "caffeine-supercycle",
  name: "Caffeine Supercycle",
  period: {
    start: "2026-11-15",
    end: "2026-11-17",
    claims_close: "2026-11-27", // terms §2: 10 days after the conference ends
  },
  tiers: [{ name: "Flat", fee: 5, cap: 50 }], // terms §5
  proof: [
    { slot: "01-ticket.pdf", kind: "file", label: "Ticket" },
    {
      slot: "02-id-document.jpg",
      kind: "file",
      label: "Identity documentation",
    },
    {
      slot: "03-request-evidence.url",
      kind: "url",
      label: "Request evidence",
      verify: "the post or message from the named person's known account containing the request",
    },
    {
      slot: "04-delivery-evidence.jpg",
      kind: "file",
      label: "Delivery evidence",
    },
    {
      slot: "05-confirmation.url",
      kind: "url",
      label: "Confirmation",
      verify: "the named person confirming they requested and received the drink from the member",
    },
  ],
  language: "en",
  body: [
    "## Qualifying delivery",
    "",
    'A **Qualifying Delivery** means the request, the procurement, the handover, and the confirmation, in that order, with respect to one named person on the roster: Lily Liu, Anatoly "Toly" Yakovenko, and Raj Gokal.',
    "",
    "- **Hot drink** — coffee, tea, hot chocolate, or similar, served hot and intended for immediate consumption.",
    "",
    "## Exclusions",
    "",
    "- Deliveries made without a request from the named person.",
    "- Drinks that were no longer hot at handover.",
    "- Deliveries to an intermediary instead of the named person's hand.",
  ].join("\n"),
};

/** The canonical parsed machine block every matrix row mutates — rendered
 * first, so every rejection test starts from real artifact bytes. */
function baseDef(): DefFrontmatter {
  return parseFrontmatter(splitDefDocument(renderDef(chairmageddon)).frontmatter);
}

describe("riprap-def/v1 — determinism (HANDOFF §6 row 1)", () => {
  it("same DefInput renders byte-identical twice", () => {
    expect(renderDef(chairmageddon)).toBe(renderDef(chairmageddon));
    expect(renderDef(caffeine)).toBe(renderDef(caffeine));
  });

  it("language defaults to en deterministically — no environment-derived bytes", () => {
    const withoutLanguage = { ...caffeine } as Partial<DefInput>;
    delete withoutLanguage.language;
    expect(renderDef(withoutLanguage as DefInput)).toBe(renderDef(caffeine));
    expect(baseDef().language).toBe("en");
  });
});

describe("riprap-def/v1 — free-form body", () => {
  it("renders the body verbatim after the frontmatter — no injected §s", () => {
    for (const vector of [chairmageddon, caffeine]) {
      const { body } = splitDefDocument(renderDef(vector));
      expect(body.trim()).toBe(vector.body.trim());
      expect(body).not.toContain("## 1. Product");
    }
  });

  it("accepts an empty body and arbitrary markdown/HTML", () => {
    for (const body of ["", "## anything", "<script>alert(1)</script>", "```\n## fenced\n```"]) {
      const doc = renderDef({ ...chairmageddon, body });
      expect(splitDefDocument(doc).body.trim()).toBe(body.trim());
    }
  });

  it("normalizes CRLF and trims the body's edge whitespace", () => {
    const doc = renderDef({
      ...chairmageddon,
      body: "  first\r\n\r\nsecond  \n",
    });
    expect(splitDefDocument(doc).body.trim()).toBe("first\n\nsecond");
  });

  it("guards only the machine block — tiers and proof must render", () => {
    expect(() => renderDef({ ...chairmageddon, tiers: [] })).toThrow(/at least one tier/);
    expect(() => renderDef({ ...chairmageddon, proof: [] })).toThrow(/at least one proof/);
    expect(() =>
      renderDef({
        ...chairmageddon,
        tiers: [{ name: "Flat", fee: 1e21, cap: 40 }],
      }),
    ).toThrow(/safe integer/);
  });
});

describe("riprap-def/v1 — validation matrix (HANDOFF §3/§6)", () => {
  it("schema tag must be exactly riprap-def/v1", () => {
    const rejections = validateFrontmatter({
      ...baseDef(),
      schema: "riprap-def/v2",
    });
    expect(rejections).toContainEqual({
      code: "unknown-schema",
      found: "riprap-def/v2",
    });
  });

  it("kind is a two-value enum", () => {
    // out-of-contract on purpose — the enum check exists for untrusted CAS bytes
    const rejections = validateFrontmatter({
      ...baseDef(),
      kind: "syndicate" as DefFrontmatter["kind"],
    });
    expect(rejections).toContainEqual({ code: "bad-kind", found: "syndicate" });
  });

  it("slug is kebab-case", () => {
    expect(validateFrontmatter({ ...baseDef(), slug: "Chairmageddon" })).toContainEqual({
      code: "bad-slug",
      found: "Chairmageddon",
    });
    expect(validateFrontmatter({ ...baseDef(), slug: "caffeine_supercycle" })).toContainEqual({
      code: "bad-slug",
      found: "caffeine_supercycle",
    });
  });

  it("name must be non-empty", () => {
    expect(validateFrontmatter({ ...baseDef(), name: "  " })).toContainEqual({
      code: "bad-name",
    });
  });

  it("period dates are ISO and ordered claims_close > end >= start", () => {
    const base = baseDef();
    expect(
      validateFrontmatter({
        ...base,
        period: { ...base.period, start: "Nov 15" },
      }),
    ).toContainEqual({ code: "bad-period", reason: "not-iso", field: "start" });
    expect(
      validateFrontmatter({
        ...base,
        period: { ...base.period, end: "2026-02-30" },
      }),
    ).toContainEqual({
      code: "bad-period",
      reason: "not-a-date",
      field: "end",
    });
    expect(
      validateFrontmatter({
        ...base,
        period: { ...base.period, end: "2026-11-14" },
      }),
    ).toContainEqual({ code: "bad-period", reason: "order" });
    expect(
      validateFrontmatter({
        ...base,
        period: { ...base.period, claims_close: "2026-11-17" },
      }),
    ).toContainEqual({ code: "bad-period", reason: "order" });
    expect(validateFrontmatter({ ...base, period: { ...base.period, venue: " " } })).toContainEqual(
      { code: "bad-period", reason: "empty", field: "venue" },
    );
  });

  it("tiers number 1–3", () => {
    expect(validateFrontmatter({ ...baseDef(), tiers: [] })).toContainEqual({
      code: "bad-tier-count",
      found: 0,
    });
    expect(
      validateFrontmatter({
        ...baseDef(),
        tiers: [1, 2, 3, 4].map((n) => ({ name: `T${n}`, fee: 10, cap: 40 })),
      }),
    ).toContainEqual({ code: "bad-tier-count", found: 4 });
  });

  it("tiers need fee > 0", () => {
    expect(
      validateFrontmatter({
        ...baseDef(),
        tiers: [{ name: "Flat", fee: 0, cap: 40 }],
      }),
    ).toContainEqual({
      code: "bad-tier",
      tier: "Flat",
      reason: "fee-not-positive",
    });
  });

  it("tiers need cap >= fee — the rejection names the tier (HANDOFF §6 row 2)", () => {
    expect(
      validateFrontmatter({
        ...baseDef(),
        tiers: [{ name: "Flat", fee: 10, cap: 5 }],
      }),
    ).toContainEqual({
      code: "bad-tier",
      tier: "Flat",
      reason: "cap-below-fee",
    });
  });

  it("proof needs at least one slot", () => {
    expect(validateFrontmatter({ ...baseDef(), proof: [] })).toContainEqual({
      code: "proof-empty",
    });
  });

  it("slot paths follow NN-slug.ext with the global MIME extensions", () => {
    for (const path of ["ticket.pdf", "1-ticket.pdf", "01-Ticket.pdf", "01-ticket.docx"]) {
      const proof = [{ slot: path, kind: "file" }] as DefFrontmatter["proof"];
      expect(validateFrontmatter({ ...baseDef(), proof })).toContainEqual({
        code: "bad-slot",
        slot: path,
        reason: "grammar",
      });
    }
  });

  it("slot ordinals are unique", () => {
    expect(
      validateFrontmatter({
        ...baseDef(),
        proof: [
          { slot: "01-ticket.pdf", kind: "file" },
          { slot: "01-id.pdf", kind: "file" },
        ],
      }),
    ).toContainEqual({
      code: "bad-slot",
      slot: "01-id.pdf",
      reason: "ordinal-duplicate",
    });
  });

  it("slot kind is file|url and agrees with the extension", () => {
    expect(
      validateFrontmatter({
        ...baseDef(),
        proof: [{ slot: "01-ticket.pdf", kind: "photo" as DefProofSlot["kind"] }], // out-of-contract on purpose
      }),
    ).toContainEqual({
      code: "bad-slot",
      slot: "01-ticket.pdf",
      reason: "bad-kind",
    });
    expect(
      validateFrontmatter({
        ...baseDef(),
        proof: [{ slot: "01-ticket.url", kind: "file" }],
      }),
    ).toContainEqual({
      code: "bad-slot",
      slot: "01-ticket.url",
      reason: "kind-mismatch",
    });
    expect(
      validateFrontmatter({
        ...baseDef(),
        proof: [{ slot: "01-ticket.pdf", kind: "url" }],
      }),
    ).toContainEqual({
      code: "bad-slot",
      slot: "01-ticket.pdf",
      reason: "kind-mismatch",
    });
  });

  it("optional slot prose must be non-empty when present", () => {
    expect(
      validateFrontmatter({
        ...baseDef(),
        proof: [{ slot: "01-ticket.pdf", kind: "file", label: " " }],
      }),
    ).toContainEqual({
      code: "bad-slot",
      slot: "01-ticket.pdf",
      reason: "empty-optional",
    });
  });

  it("marketing fields are non-empty, logo is an http(s) link, smallestPayout > 0", () => {
    expect(validateFrontmatter({ ...baseDef(), marketing: { blurb: " " } })).toContainEqual({
      code: "bad-marketing",
      field: "blurb",
      reason: "empty",
    });
    expect(validateFrontmatter({ ...baseDef(), marketing: { logo: "not-a-url" } })).toContainEqual({
      code: "bad-marketing",
      field: "logo",
      reason: "bad-url",
    });
    expect(validateFrontmatter({ ...baseDef(), marketing: { smallestPayout: 0 } })).toContainEqual({
      code: "bad-marketing",
      field: "smallestPayout",
      reason: "not-positive",
    });
  });

  it("language is a lowercase tag", () => {
    expect(validateFrontmatter({ ...baseDef(), language: "EN" })).toContainEqual({
      code: "bad-language",
      found: "EN",
    });
  });

  it("frontmatter unknown keys are rejected at parse (HANDOFF §3)", () => {
    expect(() => parseFrontmatter('schema: "riprap-def/v1"\ninsurance: "yes"')).toThrow(
      DefFormatError,
    );
    expect(() =>
      parseFrontmatter('schema: "riprap-def/v1"\nperiod:\n  start: "x"\n  doors: "9"'),
    ).toThrow(/unknown key 'doors'/);
  });

  it("integers beyond the safe range are rejected at parse and render (round-trip precision)", () => {
    expect(() =>
      parseFrontmatter(
        'schema: "riprap-def/v1"\ntiers:\n  - name: "Flat"\n    fee: 99999999999999999999\n    cap: 100',
      ),
    ).toThrow(DefFormatError);
    expect(() =>
      renderDef({
        ...chairmageddon,
        tiers: [{ name: "Flat", fee: 1e21, cap: 40 }],
      }),
    ).toThrow(/safe integer/);
  });

  it("validateDefArtifact: valid vectors reject nothing", () => {
    expect(validateDefArtifact(renderDef(chairmageddon))).toEqual([]);
    expect(validateDefArtifact(renderDef(caffeine))).toEqual([]);
  });

  it("validateDefArtifact: the body is never validated", () => {
    const arbitrary = renderDef({
      ...chairmageddon,
      body: "<script>alert(1)</script>",
    });
    expect(validateDefArtifact(arbitrary)).toEqual([]);
    const noBody = renderDef({ ...chairmageddon, body: "" });
    expect(validateDefArtifact(noBody)).toEqual([]);
  });

  it("validateDefArtifact: malformed bytes surface as one malformed rejection", () => {
    const noFence = renderDef(chairmageddon).replace("---\n", "");
    expect(validateDefArtifact(noFence)).toEqual([
      {
        code: "malformed",
        detail: expect.stringContaining("frontmatter fence"),
      },
    ]);
    expect(validateDefArtifact("")).toEqual([{ code: "malformed", detail: expect.any(String) }]);
    const foreignYaml = '---\nschema: "riprap-def/v1"\nkind: [mutual, x]\n---\n';
    expect(validateDefArtifact(foreignYaml)).toEqual([
      { code: "malformed", detail: expect.any(String) },
    ]);
  });
});

describe("riprap-def/v1 — round-trip (renderer output parses back)", () => {
  for (const vector of [chairmageddon, caffeine]) {
    it(`${vector.name} (${vector.kind}): frontmatter and body parse back`, () => {
      const doc = renderDef(vector);
      const { frontmatter, body } = splitDefDocument(doc);

      const fm = parseFrontmatter(frontmatter);
      expect(fm.kind).toBe(vector.kind);
      expect(fm.slug).toBe(vector.slug);
      expect(fm.name).toBe(vector.name);
      expect(fm.period).toEqual(vector.period);
      expect(fm.tiers).toEqual(vector.tiers);
      expect(fm.proof).toEqual(vector.proof);
      expect(fm.marketing).toEqual(vector.marketing);
      expect(fm.language).toBe("en");
      expect(body.trim()).toBe(vector.body.trim());
    });
  }

  it("parseDefDoc keeps the free-form body and drops nothing", () => {
    const def = parseDefDoc(renderDef(caffeine));
    expect(def).not.toBeNull();
    expect(def?.body.trim()).toBe(caffeine.body.trim());
  });

  it("a def with any rejection is droppable from the artifact verdict alone (HANDOFF §3: never fallback content)", () => {
    const valid = renderDef(caffeine);
    const invalid = valid.replace('slug: "caffeine-supercycle"', 'slug: "Caffeine Supercycle"');
    expect(validateDefArtifact(valid)).toEqual([]);
    expect(validateDefArtifact(invalid).length).toBeGreaterThan(0);
  });
});
