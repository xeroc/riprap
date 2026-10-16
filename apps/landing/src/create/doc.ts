// doc.ts — the #/create wizard's terms-document core (user-defined mutuals
// milestone D1/D2): the author's form model, the canonical `riprap-def/v1`
// renderer, and the client-side mirrors of every on-chain gate. Pure module
// — no React, no chain, no env.
//
// CONVERGENCE NOTE: the def-format epic lands the canonical module at
// `mutuals/def/` (schema.ts / render.ts / validate.ts / sections.ts). Until
// the swap, THIS renderer is the wizard's single byte source: the previewed
// document is what gets hashed into `policy_hash` and published to the CAS,
// so it must be deterministic by itself. The swap must reconcile the
// founder call of 2026-10-16: the explicit exclusions field is gone — the
// wizard's body is 10 §s (exclusions ride in §3's raw-policy prose), while
// mutuals/def still pins 11 §s with a §4 list the packs (juror checklist,
// claim summary) read. Until that moves, wizard-authored docs do not list
// in the store. (The marketing block agrees as of the same call: `logo`
// replaced `odds` on both sides.)
//
// Number law: doc BYTES may carry numbers (they are the pool's terms —
// entries, caps, windows); the wizard's UI packs carry none beyond inputs,
// defaults (EVENT-MUTUAL §12), and computed hashes.
//
// ZERO dependencies on chain constants by reference — the accord bounds
// mirrored here (31 jurors, 3 appeals, 3600s appeal floor, 10 draw attempts)
// are restated from initialize_mutual.rs and pinned by tests.

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

/** Mainnet USDC (the CLI README's example mint) — the wizard's default. */
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
    rejections.push({ field: "slug", line: "The slug is lowercase letters, digits, hyphens." });
  }
  if (def.tiers.length < 1 || def.tiers.length > 3) {
    rejections.push({ field: "tiers", line: "One to three tiers." });
  }
  def.tiers.forEach((tier, i) => {
    const at = `tiers.${i}`;
    if (tier.name.trim() === "") {
      rejections.push({ field: `${at}.name`, line: `Tier ${i + 1} needs a name.` });
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
      rejections.push({ field: "period.end", line: "Coverage ends after it opens." });
    }
    if (def.period.claimsClose <= def.period.end) {
      rejections.push({ field: "period.claimsClose", line: "Claims close after coverage ends." });
    }
  }
  if (def.proof.length < 1) {
    rejections.push({ field: "proof", line: "At least one proof slot." });
  }
  const ordinals = new Set<string>();
  for (const slot of def.proof) {
    if (slot.label.trim() === "") {
      rejections.push({ field: "proof", line: "Every proof slot has a label." });
    }
    if (!isValidSlotPath(slot.slot, slot.kind)) {
      rejections.push({
        field: "proof",
        line: `Slot ${slot.slot}: file slots end .pdf/.jpg/.png, link slots end .url.`,
      });
    }
    const ordinal = slot.slot.slice(0, 2);
    if (ordinals.has(ordinal)) {
      rejections.push({ field: "proof", line: `Slot ordinals are unique — ${ordinal} repeats.` });
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

// ─── Canonical renderer ─────────────────────────────────────────────────────

/** The two kind word-maps (D8: kind is a copy selector — nothing mechanical
 * differs between the kinds). */
const KIND_WORDS: Record<
  DefKind,
  {
    actHeader: string;
    productLine: string;
    memberNoun: string;
    requestNoun: string;
  }
> = {
  mutual: {
    actHeader: "Covered event",
    productLine:
      "a mutual: members chip a fixed entry against one narrowly defined peril, and a qualifying incident is paid from the pool.",
    memberNoun: "members",
    requestNoun: "payout request",
  },
  bounty: {
    actHeader: "Paid act",
    productLine:
      "a bounty: the pool pays for verified acts, on the terms in this document and nothing else.",
    memberNoun: "participants",
    requestNoun: "payout claim",
  },
};

/** YAML double-quoted scalar — the only quoting style the renderer emits
 * (determinism: one style, always). */
function yamlString(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function dollars(amount: number): string {
  return `$${amount.toLocaleString("en-US")}`;
}

/**
 * The canonical `riprap-def/v1` document: YAML frontmatter (fixed key
 * order) + the 10-§ terms body (§4 Exclusions folded into §3's raw policy
 * prose, founder call 2026-10-16 — the sections renumbered to stay
 * continuous). Deterministic — the same (def, advanced) renders
 * byte-identical, no timestamps, no locale, no randomness. The §6 prose
 * embeds the chosen economics once (milestone D2: wizard-time instruction
 * args rendered into §6 prose).
 */
export function renderDefDoc(def: DefDoc, advanced: AdvancedConfig): string {
  const words = KIND_WORDS[def.kind];
  const lines: string[] = [];

  // ── frontmatter (machine block — milestone HANDOFF §2, exact fields) ──
  lines.push("---");
  lines.push("schema: riprap-def/v1");
  lines.push(`kind: ${def.kind}`);
  lines.push(`slug: ${yamlString(def.slug)}`);
  lines.push(`name: ${yamlString(def.name)}`);
  lines.push("period:");
  lines.push(`  start: ${yamlString(def.period.start)}`);
  lines.push(`  end: ${yamlString(def.period.end)}`);
  lines.push(`  claims_close: ${yamlString(def.period.claimsClose)}`);
  if (def.period.venue !== undefined && def.period.venue !== "") {
    lines.push(`  venue: ${yamlString(def.period.venue)}`);
  }
  lines.push("tiers:");
  for (const tier of def.tiers) {
    lines.push(`  - name: ${yamlString(tier.name)}`);
    lines.push(`    fee: ${tier.fee}`);
    lines.push(`    cap: ${tier.cap}`);
  }
  lines.push("proof:");
  for (const slot of def.proof) {
    lines.push(`  - slot: ${yamlString(slot.slot)}`);
    lines.push(`    kind: ${slot.kind}`);
    if (slot.label !== "") lines.push(`    label: ${yamlString(slot.label)}`);
    if (slot.verify !== undefined && slot.verify !== "") {
      lines.push(`    verify: ${yamlString(slot.verify)}`);
    }
  }
  const marketing = def.marketing;
  if (
    marketing !== undefined &&
    (marketing.headline ||
      marketing.blurb ||
      marketing.logo ||
      marketing.share ||
      marketing.event ||
      marketing.smallestPayout !== undefined)
  ) {
    lines.push("marketing:");
    if (marketing.headline) lines.push(`  headline: ${yamlString(marketing.headline)}`);
    if (marketing.blurb) lines.push(`  blurb: ${yamlString(marketing.blurb)}`);
    if (marketing.logo) lines.push(`  logo: ${yamlString(marketing.logo)}`);
    if (marketing.share) lines.push(`  share: ${yamlString(marketing.share)}`);
    if (marketing.event) lines.push(`  event: ${yamlString(marketing.event)}`);
    if (marketing.smallestPayout !== undefined) {
      lines.push(`  smallest_payout: ${marketing.smallestPayout}`);
    }
  }
  if (def.language !== "en") lines.push(`language: ${yamlString(def.language)}`);
  lines.push("---");
  lines.push("");

  // ── body (10 fixed § headers; kind words select, prose carries) ────────
  lines.push(`# ${def.name} — terms`);
  lines.push("");
  lines.push("## 1. Product");
  lines.push("");
  lines.push(`${def.name} is ${words.productLine}`);
  lines.push("");
  lines.push(`## 2. Window`);
  lines.push("");
  if (def.period.venue !== undefined && def.period.venue !== "") {
    lines.push(
      `Coverage runs ${def.period.start} to ${def.period.end} at ${def.period.venue}. Claims close ${def.period.claimsClose}.`,
    );
  } else {
    lines.push(
      `Coverage runs ${def.period.start} to ${def.period.end}. Claims close ${def.period.claimsClose}.`,
    );
  }
  lines.push("");
  lines.push(`## 3. ${words.actHeader}`);
  lines.push("");
  for (const paragraph of def.definition
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p !== "")) {
    lines.push(paragraph);
    lines.push("");
  }
  if (def.kind === "bounty" && def.roster !== undefined && def.roster.trim() !== "") {
    lines.push("Roster:");
    lines.push("");
    lines.push(def.roster.trim());
    lines.push("");
  }
  lines.push("## 4. Tiers");
  lines.push("");
  lines.push("| Tier | Entry | Max payout |");
  lines.push("| --- | --- | --- |");
  for (const tier of def.tiers) {
    lines.push(`| ${tier.name} | ${dollars(tier.fee)} | ${dollars(tier.cap)} |`);
  }
  lines.push("");
  lines.push("## 5. Pool");
  lines.push("");
  lines.push(
    "One pot. Money leaves it through exactly two doors: payouts a jury approves, and liquidation. There is no third exit.",
  );
  lines.push("");
  lines.push("## 6. Payout requests");
  lines.push("");
  lines.push(
    `A ${words.requestNoun} files with ${def.proof.length} ${def.proof.length === 1 ? "proof" : "proofs"}, all required:`,
  );
  lines.push("");
  for (const slot of def.proof) {
    lines.push(
      `- \`${slot.slot}\` — ${slot.label}${slot.verify ? ` (jurors verify: ${slot.verify})` : ""}`,
    );
  }
  lines.push("");
  lines.push(
    `The request pre-pays an adjudication fee of ${dollars(advanced.minJurySize * advanced.feePerJurorUsdc)} (${advanced.minJurySize} jurors × ${dollars(advanced.feePerJurorUsdc)}). Jurors review for ${advanced.reviewHours} hours, commit for ${advanced.commitHours}, reveal for ${advanced.revealHours}. A ruling can be appealed within ${advanced.appealHours} hours, up to ${advanced.maxAppeals} ${advanced.maxAppeals === 1 ? "appeal" : "appeals"}. A denied request forfeits the fee; a failed adjudication returns it.`,
  );
  lines.push("");
  lines.push("## 7. End");
  lines.push("");
  lines.push(
    `When the claims window closes and approved payouts settle, everything left returns to ${words.memberNoun} pro-rata and the pool dissolves. No funds remain.`,
  );
  lines.push("");
  lines.push("## 8. Economic principle");
  lines.push("");
  lines.push(
    "The pool never pays more than it holds: if approved claims exceed the pot, payouts are reduced proportionally.",
  );
  lines.push("");
  lines.push("## 9. Example");
  lines.push("");
  const first = def.tiers[0];
  lines.push(
    `A ${first.name} ${def.kind === "mutual" ? "member" : "participant"} pays ${dollars(first.fee)} entry; an approved ${words.requestNoun} pays up to ${dollars(first.cap)}.`,
  );
  lines.push("");
  lines.push("## 10. Promise");
  lines.push("");
  lines.push(
    "These terms are the pool's whole promise — no other document governs. Payouts are at the jury's discretion; the chain enforces the caps.",
  );
  lines.push("");

  return lines.join("\n");
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
