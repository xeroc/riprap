// doc.ts — the #/create wizard's terms-document core (user-defined mutuals
// milestone D1/D2): the author's form model, the adapter onto the canonical
// `riprap-def/v1` renderer, and the client-side mirrors of every on-chain
// gate. Pure module — no React, no chain, no env.
//
// The wizard keeps the founder's 2026-10-16 shape — one raw-policy field,
// no separate exclusions input. The canonical renderer still wants a §1/§11
// peril phrase and a §4 exclusion list, so the adapter names both as
// pointers into §3: the terms document's own words carry the facts.
//
// Number law: doc BYTES may carry numbers (they are the pool's terms —
// entries, caps, windows); the wizard's UI packs carry none beyond inputs,
// defaults (EVENT-MUTUAL §12), and computed hashes.
//
// ZERO dependencies on chain constants by reference — the accord bounds
// mirrored here (31 jurors, 3 appeals, 3600s appeal floor, 10 draw attempts)
// are restated from initialize_mutual.rs and pinned by tests.

import { type DefInput, renderDef } from "../mutuals/def/render";

// ─── The def model (milestone HANDOFF §2 frontmatter + body prose) ─────────

export type DefKind = "mutual" | "bounty";

/** One cover tier: entry and max payout in whole USDC (policy-doc register —
 * the on-chain conversion to 6-dec raw units happens at deploy). */
export interface DefTier {
  name: string;
  fee: number;
  cap: number;
}

/** One required proof slot. `slot` is the canonical manifest path derived
 * from row order (`01-ticket.pdf`, `02-proof.url`) — ordinals unique by
 * construction. */
export interface DefProofSlot {
  slot: string;
  kind: "file" | "url";
  /** The member-facing plain name. */
  label: string;
  /** What the juror verifies in this slot (optional). */
  verify?: string;
}

export interface DefPeriod {
  /** ISO date — doors open; join closes at open. */
  start: string;
  /** ISO date — coverage ends. */
  end: string;
  /** ISO date — filing deadline (coverage end + reporting lag). */
  claimsClose: string;
  venue?: string;
}

export interface DefMarketing {
  headline?: string;
  blurb?: string;
  /** The pool's own logo — an external image link the hero shows. */
  logo?: string;
  share?: string;
  event?: string;
  smallestPayout?: number;
}

/** The author's whole input — frontmatter machine block + body prose. */
export interface DefDoc {
  kind: DefKind;
  slug: string;
  name: string;
  period: DefPeriod;
  tiers: DefTier[];
  proof: DefProofSlot[];
  marketing?: DefMarketing;
  language: string;
  /** §3 body prose — the raw policy: the covered act, its boundaries, and
   * its exclusions (founder call 2026-10-16: one prose field, not a forced
   * exclusions machine field). */
  definition: string;
  /** Bounty only: the named people or acts the bounty pays for. */
  roster?: string;
}

// ─── Advanced init inputs (InitializeMutualConfig + SubaccordConfig) ───────

/** The §12 pilot preset (EVENT-MUTUAL §12 — the numbers the drawer
 * pre-fills; provenance cited, never invented). Windows are authored in
 * hours and converted to seconds for the chain. */
export const PILOT_PRESET = {
  minStakeUsdc: 10,
  feePerJurorUsdc: 5,
  minJurySize: 3,
  maxAppeals: 2,
  alphaBps: 10_000,
  revealThresholdBps: 6_666,
  reviewHours: 48,
  commitHours: 12,
  revealHours: 12,
  appealHours: 48,
  maxDrawAttempts: 3,
} as const;

export interface AdvancedConfig {
  /** One mint for entries, payouts, and juror fees — the program rejects
   * mixed mints (single-asset MVP, security review 2026-09-18). Prefilled
   * with USDC; the author may point it elsewhere. */
  mint: string;
  minStakeUsdc: number;
  feePerJurorUsdc: number;
  minJurySize: number;
  maxAppeals: number;
  alphaBps: number;
  revealThresholdBps: number;
  reviewHours: number;
  commitHours: number;
  revealHours: number;
  appealHours: number;
  maxDrawAttempts: number;
}

/** Mainnet USDC (the CLI README's example mint) — the mainnet prefill;
 * mint.ts resolves the wizard's default per connected cluster. */
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export function defaultAdvanced(): AdvancedConfig {
  return { mint: USDC_MINT, ...PILOT_PRESET };
}

/** Accord domain bounds, restated (initialize_mutual.rs mirrors them;
 * tests pin these — if accord's move, both move together). */
export const ACCORD_BOUNDS = {
  maxJurors: 31,
  maxAppeals: 3,
  minAppealWindowSecs: 3_600,
  maxDrawAttempts: 10,
} as const;

export const MICRO = 1_000_000n;

/** Whole USDC → 6-dec raw units. */
export function usdcToMicro(usd: number): bigint {
  return BigInt(Math.round(usd * Number(MICRO)));
}

/** Hours → unix seconds (integer). */
export function hoursToSecs(hours: number): number {
  return Math.round(hours * 3_600);
}

/** ISO date (`2026-11-15`) → unix seconds at 00:00 UTC. */
export function dateToUnix(date: string): number {
  return Math.floor(Date.parse(`${date}T00:00:00Z`) / 1_000);
}

/** A base58-ish pubkey shape check (visual gate only — the chain is the
 * law; this exists so the drawer can flag obvious paste errors). */
export function looksLikePubkey(value: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
}

// ─── Slot paths ─────────────────────────────────────────────────────────────

/** `01-ticket.pdf` — two-digit ordinal, kebab slug of the label, `.url` for
 * link slots, else the file extension family `.pdf` (the intake MIME gate
 * allows jpeg/png/pdf; the path names the family, the file carries its
 * own). Ordinals derive from row order, so they are unique by
 * construction. */
export function slotPath(index: number, label: string, kind: "file" | "url"): string {
  const slug = slugify(label) || "proof";
  return `${String(index + 1).padStart(2, "0")}-${slug}${kind === "url" ? ".url" : ".pdf"}`;
}

/** kebab-case: lowercase, non-alphanumerics collapsed to single hyphens. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const SLOT_PATH = /^\d{2}-[a-z0-9]+(-[a-z0-9]+)*\.(pdf|jpg|jpeg|png|url)$/;

/** The slot grammar (def-format contract): `NN-slug.ext` — `.url` for link
 * slots, else a file extension from the intake MIME family (jpeg/png/pdf —
 * the blade-pool manifest carries `02-id-document.jpg`, so jpg is legal). */
export function isValidSlotPath(slot: string, kind: "file" | "url"): boolean {
  if (!SLOT_PATH.test(slot)) return false;
  return kind === "url" ? slot.endsWith(".url") : !slot.endsWith(".url");
}

// ─── Validation ─────────────────────────────────────────────────────────────

export interface Rejection {
  /** Dotted path into the author state — the form maps it to its field. */
  field: string;
  /** One deadpan line (copy doc § /create — the form shows it under the
   * field, the deploy fails with the same words on-chain). */
  line: string;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Def-level validation (milestone HANDOFF §3/§6 matrix). Pure; every
 * rejection names its field. */
export function validateDef(def: DefDoc): Rejection[] {
  const rejections: Rejection[] = [];
  if (def.name.trim() === "") {
    rejections.push({ field: "name", line: "The pool needs a name." });
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(def.slug)) {
    rejections.push({
      field: "slug",
      line: "The slug is lowercase letters, digits, hyphens.",
    });
  }
  if (def.tiers.length < 1 || def.tiers.length > 3) {
    rejections.push({ field: "tiers", line: "One to three tiers." });
  }
  def.tiers.forEach((tier, i) => {
    const at = `tiers.${i}`;
    if (tier.name.trim() === "") {
      rejections.push({
        field: `${at}.name`,
        line: `Tier ${i + 1} needs a name.`,
      });
    }
    if (!Number.isFinite(tier.fee) || tier.fee <= 0 || !Number.isInteger(tier.fee)) {
      rejections.push({
        field: `${at}.fee`,
        line: `Tier ${i + 1}: whole-dollar entry above zero.`,
      });
    }
    if (!Number.isFinite(tier.cap) || !Number.isInteger(tier.cap) || tier.cap < tier.fee) {
      rejections.push({
        field: `${at}.cap`,
        line: `Tier ${i + 1}: the max payout is at least the entry.`,
      });
    }
  });
  const names = def.tiers.map((t) => t.name.trim().toLowerCase());
  if (new Set(names).size !== names.length) {
    rejections.push({ field: "tiers", line: "Tier names are unique." });
  }
  const windowDates = [def.period.start, def.period.end, def.period.claimsClose];
  if (!windowDates.every((date) => ISO_DATE.test(date))) {
    rejections.push({ field: "period", line: "The window needs three dates." });
  } else {
    if (def.period.end < def.period.start) {
      rejections.push({
        field: "period.end",
        line: "Coverage ends after it opens.",
      });
    }
    if (def.period.claimsClose <= def.period.end) {
      rejections.push({
        field: "period.claimsClose",
        line: "Claims close after coverage ends.",
      });
    }
  }
  if (def.proof.length < 1) {
    rejections.push({ field: "proof", line: "At least one proof slot." });
  }
  const ordinals = new Set<string>();
  for (const slot of def.proof) {
    if (slot.label.trim() === "") {
      rejections.push({
        field: "proof",
        line: "Every proof slot has a label.",
      });
    }
    if (!isValidSlotPath(slot.slot, slot.kind)) {
      rejections.push({
        field: "proof",
        line: `Slot ${slot.slot}: file slots end .pdf/.jpg/.png, link slots end .url.`,
      });
    }
    const ordinal = slot.slot.slice(0, 2);
    if (ordinals.has(ordinal)) {
      rejections.push({
        field: "proof",
        line: `Slot ordinals are unique — ${ordinal} repeats.`,
      });
    }
    ordinals.add(ordinal);
  }
  if (def.definition.trim() === "") {
    rejections.push({
      field: "definition",
      line: "The terms are the pool's whole policy — write them.",
    });
  }
  if (def.marketing?.logo !== undefined && !/^https?:\/\/\S+$/.test(def.marketing.logo)) {
    rejections.push({
      field: "marketing.logo",
      line: "The logo is an image link — http(s) only.",
    });
  }
  if (
    def.marketing?.smallestPayout !== undefined &&
    !Number.isInteger(def.marketing.smallestPayout)
  ) {
    rejections.push({
      field: "marketing.smallestPayout",
      line: "Smallest payout is whole dollars.",
    });
  }
  return rejections;
}

/** The on-chain gates, mirrored client-side (initialize_mutual.rs — one
 * deadpan note per gate; the chain rejects with the same words). Pure. */
export function validateAdvanced(
  advanced: AdvancedConfig,
  def: DefDoc,
  nowSecs: number,
): Rejection[] {
  const rejections: Rejection[] = [];
  const sub = (field: string, line: string) => rejections.push({ field, line });

  if (!looksLikePubkey(advanced.mint)) {
    sub("advanced.mint", "A mint pubkey — classic SPL Token, no Token-2022.");
  }
  const depositsClose = dateToUnix(def.period.start);
  const claimsClose = dateToUnix(def.period.claimsClose);
  if (!(claimsClose > depositsClose && depositsClose > nowSecs)) {
    sub("period.start", "Doors open in the future, claims close after them.");
  }
  // contribution > 0 && max_payout >= contribution — def-level too, but the
  // chain gate is the authority; mirrored for the drawer's tier rows.
  for (let i = 0; i < def.tiers.length; i++) {
    const tier = def.tiers[i];
    if (!(tier.fee > 0 && tier.cap >= tier.fee)) {
      sub(`tiers.${i}.cap`, `Tier ${i + 1}: the max payout is at least the entry.`);
    }
  }
  if (advanced.minJurySize % 2 !== 1) {
    sub("advanced.minJurySize", "Must be odd.");
  }
  if (advanced.maxAppeals < 0 || advanced.maxAppeals > ACCORD_BOUNDS.maxAppeals) {
    sub("advanced.maxAppeals", "The appeal ladder must fit 31 jurors.");
  } else {
    // (J+1)·2^appeals − 1 ≤ 31 — the same arithmetic the chain checks.
    const ladderTop = ((BigInt(advanced.minJurySize) + 1n) << BigInt(advanced.maxAppeals)) - 1n;
    if (ladderTop > BigInt(ACCORD_BOUNDS.maxJurors)) {
      sub("advanced.maxAppeals", "The appeal ladder must fit 31 jurors.");
    }
  }
  if (advanced.alphaBps > 10_000) {
    sub("advanced.alphaBps", "0–10000.");
  }
  if (usdcToMicro(advanced.minStakeUsdc) <= 0n) {
    sub("advanced.minStakeUsdc", "Must be above zero.");
  }
  if (usdcToMicro(advanced.feePerJurorUsdc) <= 0n) {
    sub("advanced.feePerJurorUsdc", "Must be above zero.");
  }
  if (
    hoursToSecs(advanced.reviewHours) <= 0 ||
    hoursToSecs(advanced.commitHours) <= 0 ||
    hoursToSecs(advanced.revealHours) <= 0
  ) {
    sub("advanced.reviewHours", "Windows must be above zero.");
  }
  if (hoursToSecs(advanced.appealHours) < ACCORD_BOUNDS.minAppealWindowSecs) {
    sub("advanced.appealHours", "At least 1 hour.");
  }
  if (advanced.revealThresholdBps > 10_000) {
    sub("advanced.revealThresholdBps", "0–10000.");
  }
  if (advanced.maxDrawAttempts < 1 || advanced.maxDrawAttempts > ACCORD_BOUNDS.maxDrawAttempts) {
    sub("advanced.maxDrawAttempts", "1–10.");
  }
  return rejections;
}

// ─── Canonical renderer adapter ─────────────────────────────────────────────

/** Clean marketing copy: the wizard's fields go empty when cleared, and the
 * canonical renderer would emit the empty strings as terms. Positive
 * smallestPayout only — the wizard never publishes a 0. */
function marketingFor(marketing: DefMarketing | undefined): DefInput["marketing"] {
  if (marketing === undefined) return undefined;
  const out: NonNullable<DefInput["marketing"]> = {};
  for (const key of ["headline", "blurb", "logo", "share", "event"] as const) {
    const value = marketing[key];
    if (value !== undefined && value !== "") out[key] = value;
  }
  if (marketing.smallestPayout !== undefined && marketing.smallestPayout > 0) {
    out.smallestPayout = marketing.smallestPayout;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** The wizard's one raw-policy field → the canonical body. The peril (§1/
 * §11) and the exclusions (§4) are named as pointers into §3: the founder's
 * single prose field carries those facts, and the document says where. */
function defInput(def: DefDoc, advanced: AdvancedConfig): DefInput {
  const blocks = def.definition
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p !== "");
  const marketing = marketingFor(def.marketing);
  const filingFeeUsdc = advanced.minJurySize * advanced.feePerJurorUsdc;
  return {
    kind: def.kind,
    slug: def.slug,
    name: def.name,
    period: {
      start: def.period.start,
      end: def.period.end,
      claims_close: def.period.claimsClose,
      ...(def.period.venue !== undefined && def.period.venue !== ""
        ? { venue: def.period.venue }
        : {}),
    },
    tiers: def.tiers,
    proof: def.proof.map((slot) => ({
      slot: slot.slot,
      kind: slot.kind,
      ...(slot.label !== "" ? { label: slot.label } : {}),
      ...(slot.verify !== undefined && slot.verify !== "" ? { verify: slot.verify } : {}),
    })),
    ...(marketing !== undefined ? { marketing } : {}),
    language: def.language,
    peril: def.kind === "mutual" ? "the event defined in §3" : "the act defined in §3",
    definition: [
      ...(blocks.length > 0 ? blocks : ["{{PARAM}}"]),
      // the canonical format has no roster field — it is §3 prose
      ...(def.kind === "bounty" && def.roster !== undefined && def.roster.trim() !== ""
        ? [`Roster:\n\n${def.roster.trim()}`]
        : []),
    ],
    exclusions: [
      def.kind === "mutual"
        ? "anything not named in §3"
        : "anything not named in §3 as a qualifying delivery",
    ],
    ...(Number.isSafeInteger(filingFeeUsdc) && filingFeeUsdc > 0
      ? { economics: { filingFeeUsdc } }
      : {}),
  };
}

/**
 * The canonical `riprap-def/v1` document for the wizard's state. The
 * canonical renderer at `mutuals/def/render.ts` is the one byte source —
 * deterministic, quoted YAML, 11 §s; the previewed bytes are what gets
 * hashed into `policy_hash` and published to the CAS. The §7 prose embeds
 * the chosen economics once (wizard-time instruction args).
 */
export function renderDefDoc(def: DefDoc, advanced: AdvancedConfig): string {
  return renderDef(defInput(def, advanced));
}

// ─── Deploy-time derivations (the deploy step consumes these) ──────────────

/** Def tiers → the on-chain `[Tier; 3]`: a 1–2 tier def fills the remaining
 * slots by repeating its last tier (identical economics; join picks an
 * index, duplicates are indistinguishable). */
export function defToOnChainTiers(def: DefDoc): { contribution: bigint; maxPayout: bigint }[] {
  if (def.tiers.length === 0) throw new Error("def has no tiers");
  const out = def.tiers.map((t) => ({
    contribution: usdcToMicro(t.fee),
    maxPayout: usdcToMicro(t.cap),
  }));
  while (out.length < 3) out.push(out[out.length - 1]);
  return out;
}

/** The filing fee a claimant pre-pays: min_jury_size × fee_per_juror
 * (EVENT-MUTUAL §2.6), raw units. */
export function juryFeeMicro(advanced: AdvancedConfig): bigint {
  return BigInt(advanced.minJurySize) * usdcToMicro(advanced.feePerJurorUsdc);
}

/** A fresh random u64 seed (crypto RNG; the preview re-picks on collision
 * with a live mutual address). */
export function randomSeed(): bigint {
  const buf = new BigUint64Array(1);
  crypto.getRandomValues(buf);
  return buf[0];
}
