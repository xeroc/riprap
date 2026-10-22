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

import { DEF_SCHEMA, type DefFrontmatter, parseFrontmatter, splitDefDocument } from "./schema";

/** One validation failure. `code` is the matrix row; the payload names the
 * offender (milestone §6: "the rejection names the tier"). */
export type DefRejection =
  | { code: "malformed"; detail: string }
  | { code: "unknown-schema"; found: string }
  | { code: "bad-kind"; found: string }
  | { code: "bad-slug"; found: string }
  | { code: "bad-name" }
  | {
      code: "bad-period";
      reason: "not-iso" | "not-a-date" | "order" | "empty";
      field?: string;
    }
  | { code: "bad-tier-count"; found: number }
  | {
      code: "bad-tier";
      tier: string;
      reason: "name-empty" | "fee-not-positive" | "cap-below-fee";
    }
  | { code: "proof-empty" }
  | {
      code: "bad-slot";
      slot: string;
      reason: "grammar" | "ordinal-duplicate" | "bad-kind" | "kind-mismatch" | "empty-optional";
      detail?: string;
    }
  | {
      code: "bad-marketing";
      field: string;
      reason: "empty" | "bad-url" | "not-positive";
    }
  | { code: "bad-language"; found: string };

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
      rejections.push({
        code: "bad-tier",
        tier: tier.name,
        reason: "name-empty",
      });
    }
    if (tier.fee <= 0) {
      rejections.push({
        code: "bad-tier",
        tier: tier.name,
        reason: "fee-not-positive",
      });
    }
    if (tier.cap < tier.fee) {
      rejections.push({
        code: "bad-tier",
        tier: tier.name,
        reason: "cap-below-fee",
      });
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
      rejections.push({
        code: "bad-slot",
        slot: slot.slot,
        reason: "ordinal-duplicate",
      });
    }
    ordinals.add(ordinal);
    if (slot.kind !== "file" && slot.kind !== "url") {
      rejections.push({
        code: "bad-slot",
        slot: slot.slot,
        reason: "bad-kind",
      });
    } else {
      // kind and extension must agree: url slots ride .url, file slots
      // the global jpeg/png/pdf set
      const extOk = slot.kind === "url" ? ext === "url" : FILE_EXTENSIONS.includes(ext);
      if (!extOk) {
        rejections.push({
          code: "bad-slot",
          slot: slot.slot,
          reason: "kind-mismatch",
        });
      }
    }
    if (
      (slot.label !== undefined && slot.label.trim() === "") ||
      (slot.verify !== undefined && slot.verify.trim() === "")
    ) {
      rejections.push({
        code: "bad-slot",
        slot: slot.slot,
        reason: "empty-optional",
      });
    }
  }

  const marketing = def.marketing;
  if (marketing !== undefined) {
    for (const field of ["headline", "blurb", "logo", "share", "event"] as const) {
      const value = marketing[field];
      if (value !== undefined && value.trim() === "") {
        rejections.push({ code: "bad-marketing", field, reason: "empty" });
      }
    }
    if (marketing.logo !== undefined && !/^https?:\/\/\S+$/.test(marketing.logo)) {
      rejections.push({
        code: "bad-marketing",
        field: "logo",
        reason: "bad-url",
      });
    }
    if (
      marketing.smallestPayout !== undefined &&
      (!Number.isInteger(marketing.smallestPayout) || marketing.smallestPayout <= 0)
    ) {
      rejections.push({
        code: "bad-marketing",
        field: "smallestPayout",
        reason: "not-positive",
      });
    }
  }

  if (!LANGUAGE_TAG.test(def.language)) {
    rejections.push({ code: "bad-language", found: def.language });
  }

  return rejections;
}

/** The whole-artifact matrix the store can run on CAS bytes: parse
 *  (grammar + unknown keys → `malformed`) and the machine-block rules.
 *  The body is the author's free-form markdown — never validated. */
export function validateDefArtifact(doc: string): DefRejection[] {
  let def: DefFrontmatter;
  try {
    def = parseFrontmatter(splitDefDocument(doc).frontmatter);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return [{ code: "malformed", detail }];
  }
  return validateFrontmatter(def);
}
