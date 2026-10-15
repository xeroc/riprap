// The riprap-def/v1 artifact — the machine block (YAML frontmatter) plus the
// § body of a user-defined mutual's terms doc (milestone riprap-9bh4, D1/D2).
// One markdown file; policy_hash = sha256(whole file); anchored on-chain via
// initialize_mutual's domain_ref binding and served content-addressed from
// the evidence daemon's domain CAS. This module is the shape seam: types for
// the HANDOFF §2 frontmatter contract plus `parseDefDoc` (frontmatter split +
// YAML parse + shape gate). The full validation matrix lives in validate.ts
// (def-format epic); a def that parses here but fails semantic validation is
// the store's job to drop.
import { parse as parseYaml } from "yaml";

/** `kind` — a copy-selector enum only; nothing mechanical differs (D8). */
export type DefKind = "mutual" | "bounty";

/** §2 coverage/bounty period (§2 of the terms body renders it). */
export interface DefPeriod {
  start: string;
  end: string;
  claims_close: string;
  venue?: string;
}

/** One §5 tier — entry fee and maximum payout, USD. */
export interface DefTier {
  name: string;
  fee: number;
  cap: number;
}

/** One §7 proof slot — the single source every slot list derives from (D3). */
export interface DefProofSlot {
  /** ordinal slot id, `NN-slug.ext` grammar */
  slot: string;
  kind: "file" | "url";
  label?: string;
  /** what the jury checks for this slot (adjudication packs read it) */
  verify?: string;
}

/** Optional hero marketing block — every field templated when absent. */
export interface DefMarketing {
  headline?: string;
  blurb?: string;
  odds?: string[];
  /** share-message template; `{name}`/`{event}`/`{fee}`/`{cap}` tokens */
  share?: string;
  event?: string;
  smallestPayout?: number;
}

/** A parsed riprap-def/v1 doc: the machine block + the § body markdown. */
export interface RiprapDef {
  schema: "riprap-def/v1";
  kind: DefKind;
  slug: string;
  name: string;
  period: DefPeriod;
  tiers: DefTier[];
  proof: DefProofSlot[];
  marketing?: DefMarketing;
  /** default "en" */
  language: string;
  /** the 11-§ terms body (see sections.ts) */
  body: string;
}

export const DEF_SCHEMA = "riprap-def/v1";

/** Split the leading `---` frontmatter fence: the YAML head and the § body
 *  (null when the doc doesn't open with a fence). */
export function splitFrontmatter(doc: string): { frontmatter: string; body: string } | null {
  if (!doc.startsWith("---")) return null;
  const end = doc.indexOf("\n---", 3);
  if (end === -1) return null;
  return {
    frontmatter: doc.slice(3, end).replace(/^\n/, ""),
    body: doc.slice(end + 4).replace(/^\n/, ""),
  };
}

const nonEmpty = (v: unknown): string | undefined =>
  typeof v === "string" && v.length > 0 ? v : undefined;

export function parseDefDoc(doc: string): RiprapDef | null {
  const parts = splitFrontmatter(doc);
  if (parts === null) return null;
  let raw: unknown;
  try {
    raw = parseYaml(parts.frontmatter);
  } catch {
    return null;
  }
  const m = raw as Record<string, unknown> | null;
  if (m === null || typeof m !== "object" || Array.isArray(m)) return null;
  if (m.schema !== DEF_SCHEMA) return null;
  if (m.kind !== "mutual" && m.kind !== "bounty") return null;
  if (typeof m.slug !== "string" || m.slug.length === 0) return null;
  if (typeof m.name !== "string" || m.name.length === 0) return null;

  const period = m.period as Record<string, unknown> | undefined;
  if (
    period === undefined ||
    typeof period !== "object" ||
    Array.isArray(period) ||
    typeof period.start !== "string" ||
    typeof period.end !== "string" ||
    typeof period.claims_close !== "string"
  ) {
    return null;
  }

  const tiersRaw = m.tiers;
  if (!Array.isArray(tiersRaw) || tiersRaw.length < 1 || tiersRaw.length > 3) return null;
  const tiers: DefTier[] = [];
  for (const t of tiersRaw as Record<string, unknown>[]) {
    if (
      typeof t?.name !== "string" ||
      t.name.length === 0 ||
      typeof t.fee !== "number" ||
      typeof t.cap !== "number" ||
      !(t.fee > 0) ||
      !(t.cap > 0)
    ) {
      return null;
    }
    tiers.push({ name: t.name, fee: t.fee, cap: t.cap });
  }

  const proofRaw = m.proof;
  if (!Array.isArray(proofRaw) || proofRaw.length < 1) return null;
  const proof: DefProofSlot[] = [];
  for (const p of proofRaw as Record<string, unknown>[]) {
    if (typeof p?.slot !== "string" || p.slot.length === 0) return null;
    if (p.kind !== "file" && p.kind !== "url") return null;
    proof.push({
      slot: p.slot,
      kind: p.kind,
      label: typeof p.label === "string" && p.label.length > 0 ? p.label : undefined,
      verify: typeof p.verify === "string" && p.verify.length > 0 ? p.verify : undefined,
    });
  }

  let marketing: DefMarketing | undefined;
  const rawMarketing = m.marketing;
  if (rawMarketing !== undefined) {
    const mk = rawMarketing as Record<string, unknown>;
    if (typeof mk !== "object" || mk === null || Array.isArray(mk)) return null;
    if (mk.odds !== undefined) {
      if (!Array.isArray(mk.odds) || mk.odds.some((o) => typeof o !== "string")) return null;
    }
    marketing = {
      headline: nonEmpty(mk.headline),
      blurb: nonEmpty(mk.blurb),
      odds: Array.isArray(mk.odds) ? (mk.odds as string[]) : undefined,
      share: nonEmpty(mk.share),
      event: nonEmpty(mk.event),
      smallestPayout: typeof mk.smallestPayout === "number" ? mk.smallestPayout : undefined,
    };
  }

  return {
    schema: DEF_SCHEMA,
    kind: m.kind,
    slug: m.slug,
    name: m.name,
    period: {
      start: period.start,
      end: period.end,
      claims_close: period.claims_close,
      venue: nonEmpty(period.venue),
    },
    tiers,
    proof,
    marketing,
    language: nonEmpty(m.language) ?? "en",
    body: parts.body,
  };
}
