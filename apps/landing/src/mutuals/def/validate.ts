// riprap-def/v1 — the validation matrix (milestone riprap-9bh4 HANDOFF
// §3/§6, one exported rejection per path). Every rule that decides
// whether an artifact is a valid def lives here as a DefRejection code;
// the store drops unknown on-chain mutuals whose defs produce any
// rejection (a 404 or hash mismatch never reaches this module — those
// are CAS states, not def states).
//
// Parse-time structure (grammar, unknown keys, types) throws
// DefFormatError in schema.ts; here it surfaces as the `malformed`
// rejection. Value semantics never throw — they collect.
//
// Pure module: no UI, no chain, no daemon calls.

import type { DefInput } from "./render";
import { DEF_SCHEMA, type DefFrontmatter, parseFrontmatter, splitDefDocument } from "./schema";
import { parseSections, SECTION_COUNT, sectionTitles } from "./sections";

/** One validation failure. `code` is the matrix row; the payload names the
 * offender (milestone §6: "the rejection names the tier"). */
export type DefRejection =
  | { code: "malformed"; detail: string }
  | { code: "unknown-schema"; found: string }
  | { code: "bad-kind"; found: string }
  | { code: "bad-slug"; found: string }
  | { code: "bad-name" }
  | { code: "bad-period"; reason: "not-iso" | "not-a-date" | "order" | "empty"; field?: string }
  | { code: "bad-tier-count"; found: number }
  | { code: "bad-tier"; tier: string; reason: "name-empty" | "fee-not-positive" | "cap-below-fee" }
  | { code: "proof-empty" }
  | {
      code: "bad-slot";
      slot: string;
      reason: "grammar" | "ordinal-duplicate" | "bad-kind" | "kind-mismatch" | "empty-optional";
      detail?: string;
    }
  | { code: "bad-marketing"; field: string; reason: "empty" | "bad-odds-row" | "not-positive" }
  | { code: "bad-language"; found: string }
  | { code: "bad-prose"; field: "peril" | "definition" | "exclusions" | "economics" }
  | {
      code: "bad-body";
      reason: "section-count" | "section-number" | "section-title";
      section?: number;
    };

const KINDS = ["mutual", "bounty"] as const;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const LANGUAGE_TAG = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/;
// riprap-claim/v1 manifest paths: NN-slug.ext — two-digit ordinal, kebab
// stem, file extension from the global MIME set (jpeg/png/pdf) or .url.
// The `kind` field must agree with the extension.
const SLOT_PATH = /^(\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)\.(pdf|jpe?g|png|url)$/;
const FILE_EXTENSIONS = ["pdf", "jpg", "jpeg", "png"];

function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/** The machine-block matrix (HANDOFF §2): schema tag, kind enum, slug,
 * name, period sanity (claims_close > end >= start, ISO dates), tiers
 * (1–3, fee > 0, cap >= fee), proof slot grammar (NN-slug.ext, ordinals
 * unique, kind file|url consistent with the extension), marketing
 * shapes, language tag. */
export function validateFrontmatter(def: DefFrontmatter): DefRejection[] {
  const rejections: DefRejection[] = [];

  if (def.schema !== DEF_SCHEMA) {
    rejections.push({ code: "unknown-schema", found: def.schema });
  }
  if (!(KINDS as readonly string[]).includes(def.kind)) {
    rejections.push({ code: "bad-kind", found: def.kind });
  }
  if (!SLUG.test(def.slug)) {
    rejections.push({ code: "bad-slug", found: def.slug });
  }
  if (def.name.trim() === "") {
    rejections.push({ code: "bad-name" });
  }

  const { period } = def;
  for (const field of ["start", "end", "claims_close"] as const) {
    const value = period[field];
    if (!isIsoDate(value)) {
      const reason = ISO_DATE.test(value) ? "not-a-date" : "not-iso";
      rejections.push({ code: "bad-period", reason, field });
    }
  }
  if (period.venue !== undefined && period.venue.trim() === "") {
    rejections.push({ code: "bad-period", reason: "empty", field: "venue" });
  }
  if (
    isIsoDate(period.start) &&
    isIsoDate(period.end) &&
    isIsoDate(period.claims_close) &&
    !(period.claims_close > period.end && period.end >= period.start)
  ) {
    rejections.push({ code: "bad-period", reason: "order" });
  }

  if (def.tiers.length < 1 || def.tiers.length > 3) {
    rejections.push({ code: "bad-tier-count", found: def.tiers.length });
  }
  for (const tier of def.tiers) {
    if (tier.name.trim() === "") {
      rejections.push({ code: "bad-tier", tier: tier.name, reason: "name-empty" });
    }
    if (tier.fee <= 0) {
      rejections.push({ code: "bad-tier", tier: tier.name, reason: "fee-not-positive" });
    }
    if (tier.cap < tier.fee) {
      rejections.push({ code: "bad-tier", tier: tier.name, reason: "cap-below-fee" });
    }
  }

  if (def.proof.length === 0) {
    rejections.push({ code: "proof-empty" });
  }
  const ordinals = new Set<string>();
  for (const slot of def.proof) {
    const m = SLOT_PATH.exec(slot.slot);
    if (m === null) {
      rejections.push({ code: "bad-slot", slot: slot.slot, reason: "grammar" });
      continue;
    }
    const ordinal = m[1];
    const ext = m[3];
    if (ordinals.has(ordinal)) {
      rejections.push({ code: "bad-slot", slot: slot.slot, reason: "ordinal-duplicate" });
    }
    ordinals.add(ordinal);
    if (slot.kind !== "file" && slot.kind !== "url") {
      rejections.push({ code: "bad-slot", slot: slot.slot, reason: "bad-kind" });
    } else {
      // kind and extension must agree: url slots ride .url, file slots
      // the global jpeg/png/pdf set
      const extOk = slot.kind === "url" ? ext === "url" : FILE_EXTENSIONS.includes(ext);
      if (!extOk) {
        rejections.push({ code: "bad-slot", slot: slot.slot, reason: "kind-mismatch" });
      }
    }
    if (
      (slot.label !== undefined && slot.label.trim() === "") ||
      (slot.verify !== undefined && slot.verify.trim() === "")
    ) {
      rejections.push({ code: "bad-slot", slot: slot.slot, reason: "empty-optional" });
    }
  }

  const marketing = def.marketing;
  if (marketing !== undefined) {
    for (const field of ["headline", "blurb", "share", "event"] as const) {
      const value = marketing[field];
      if (value !== undefined && value.trim() === "") {
        rejections.push({ code: "bad-marketing", field, reason: "empty" });
      }
    }
    if (marketing.odds !== undefined) {
      marketing.odds.forEach((row, n) => {
        if (
          row.length !== 2 ||
          row.some((cell) => typeof cell !== "string" || cell.trim() === "")
        ) {
          rejections.push({ code: "bad-marketing", field: `odds[${n}]`, reason: "bad-odds-row" });
        }
      });
    }
    if (
      marketing.smallestPayout !== undefined &&
      (!Number.isInteger(marketing.smallestPayout) || marketing.smallestPayout <= 0)
    ) {
      rejections.push({ code: "bad-marketing", field: "smallestPayout", reason: "not-positive" });
    }
  }

  if (!LANGUAGE_TAG.test(def.language)) {
    rejections.push({ code: "bad-language", found: def.language });
  }

  return rejections;
}

/** The authoring-input matrix: the frontmatter rules against the input's
 * machine block, plus the body-prose presence rules (§1/§3/§4/§7 carry no
 * blanks). The wizard runs this before rendering; renderDef throws on the
 * same prose fields. */
export function validateDefInput(input: DefInput): DefRejection[] {
  const def: DefFrontmatter = {
    ...input,
    schema: DEF_SCHEMA,
    language: input.language ?? "en",
  };
  const rejections = validateFrontmatter(def);
  if (input.peril.trim() === "") {
    rejections.push({ code: "bad-prose", field: "peril" });
  }
  if (input.definition.length === 0 || input.definition.some((b) => b.trim() === "")) {
    rejections.push({ code: "bad-prose", field: "definition" });
  }
  if (input.exclusions.length === 0 || input.exclusions.some((l) => l.trim() === "")) {
    rejections.push({ code: "bad-prose", field: "exclusions" });
  }
  if (
    input.economics !== undefined &&
    (!Number.isInteger(input.economics.filingFeeUsdc) || input.economics.filingFeeUsdc <= 0)
  ) {
    rejections.push({ code: "bad-prose", field: "economics" });
  }
  return rejections;
}

/** The whole-artifact matrix the store runs on CAS bytes: parse (grammar
 * + unknown keys → `malformed`), the machine-block rules, and the body
 * structure (exactly the 11 §s, numbered 1–11, kind-matching titles —
 * only a canonical artifact is a listable def). */
export function validateDefArtifact(doc: string): DefRejection[] {
  let def: DefFrontmatter;
  let body: string;
  try {
    const split = splitDefDocument(doc);
    def = parseFrontmatter(split.frontmatter);
    body = split.body;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return [{ code: "malformed", detail }];
  }

  const rejections = validateFrontmatter(def);

  const sections = parseSections(body);
  if (sections.length !== SECTION_COUNT) {
    rejections.push({ code: "bad-body", reason: "section-count" });
    return rejections;
  }
  const titles = sectionTitles(def.kind);
  sections.forEach((section, n) => {
    if (section.number !== n + 1) {
      rejections.push({ code: "bad-body", reason: "section-number", section: n + 1 });
    }
    if (section.title !== titles[n]) {
      rejections.push({ code: "bad-body", reason: "section-title", section: n + 1 });
    }
  });

  return rejections;
}
