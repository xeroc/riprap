// riprap-def/v1 — the artifact's machine block (milestone riprap-9bh4
// HANDOFF §2, decisions D1/D2): one markdown file = YAML frontmatter +
// the author's free-form body; `sha256(utf8(whole file))` is the
// `policy_hash` anchored on-chain via the existing domainRefHex path. This
// module owns the envelope and the frontmatter contract: a strict parser for
// exactly the grammar render.ts emits — unknown keys, wrong value types, and
// foreign YAML are rejected outright (DefFormatError). Value semantics
// (enums, ranges, ordering, slot grammar) live one file over, in
// validate.ts.
//
// Pure module: no UI, no chain, no daemon calls.

import type { MutualTier, PoolKind } from "../types";

/** The artifact's schema tag — the one allowed value of `frontmatter.schema`. */
export const DEF_SCHEMA = "riprap-def/v1";

/** Structural rejection: the bytes are not canonical riprap-def/v1 shape.
 * Value-level rejections (bad tier, bad slot, bad period) are NOT this —
 * those parse fine and come back as validate.ts rejection codes. */
export class DefFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DefFormatError";
  }
}

export type DefTier = MutualTier;
export type DefProofKind = "file" | "url";

/** One proof requirement. `slot` is the riprap-claim/v1 manifest path
 * (`NN-slug.ext`, ordinals unique); `label` is the member-facing name the
 * claim wizard and the juror session share; `verify` is optional prose on
 * how the jury checks it. */
export interface DefProofSlot {
  slot: string;
  kind: DefProofKind;
  label?: string;
  verify?: string;
}

/** The pool's own logo — an external image link the hero shows (2026-10-16
 * founder call: replaced the mock actuarial odds table). */
export type DefLogoUrl = string;

/** Optional hero/card marketing copy (milestone D5) — template defaults
 * fill every absent field downstream; all keys optional. */
export interface DefMarketing {
  headline?: string;
  /** doubles as the derived listing's tagline (store resolution) */
  blurb?: string;
  logo?: DefLogoUrl;
  share?: string;
  /** the event frame, e.g. "Breakpoint 2026" */
  event?: string;
  /** the smallest single success payment, USD — overrides the derived min cap */
  smallestPayout?: number;
}

export interface DefPeriod {
  /** ISO YYYY-MM-DD */
  start: string;
  /** ISO YYYY-MM-DD; end >= start */
  end: string;
  /** ISO YYYY-MM-DD; claims_close > end */
  claims_close: string;
  venue?: string;
}

/** The typed machine block. Post-parse, `language` is always set
 * (absent frontmatter normalizes to "en" — milestone HANDOFF §2). */
export interface DefFrontmatter {
  schema: string;
  kind: PoolKind;
  slug: string;
  name: string;
  period: DefPeriod;
  tiers: DefTier[];
  proof: DefProofSlot[];
  marketing?: DefMarketing;
  language: string;
}

// ---------------------------------------------------------------------------
// Envelope
// ---------------------------------------------------------------------------

/** Split `---` fences: the frontmatter block and the body (render.ts's
 * output, sections.ts's input). Throws DefFormatError on a missing or
 * unterminated fence. */
export function splitDefDocument(doc: string): {
  frontmatter: string;
  body: string;
} {
  const lines = doc.split("\n");
  if (lines[0] !== "---") {
    throw new DefFormatError("def must open with a '---' frontmatter fence");
  }
  const end = lines.indexOf("---", 1);
  if (end === -1) {
    throw new DefFormatError("unterminated frontmatter — missing closing '---'");
  }
  return {
    frontmatter: lines.slice(1, end).join("\n"),
    body: lines.slice(end + 1).join("\n"),
  };
}

// ---------------------------------------------------------------------------
// Canonical string escaping — render.ts emits, the parser below reads.
// Double quote, backslash, and controls escape; everything else is raw.
// ---------------------------------------------------------------------------

const ESCAPES: Record<string, string> = {
  '"': '\\"',
  "\\": "\\\\",
  "\n": "\\n",
  "\r": "\\r",
  "\t": "\\t",
};

/** Canonical double-quoted scalar — the only string form the grammar has. */
export function dq(value: string): string {
  return `"${value.replace(/["\\\n\r\t]/g, (c) => ESCAPES[c] ?? c)}"`;
}

/** Read one quoted string starting at `s[start] === '"'`; returns the value
 * and the index just past the closing quote. */
function readQuoted(s: string, start: number, at: string): [string, number] {
  let j = start + 1;
  let out = "";
  while (true) {
    if (j >= s.length) throw new DefFormatError(`${at}: unterminated string`);
    const c = s[j];
    if (c === "\\") {
      const n = s[j + 1];
      if (n === undefined) throw new DefFormatError(`${at}: dangling escape`);
      out += n === "n" ? "\n" : n === "t" ? "\t" : n === "r" ? "\r" : n;
      j += 2;
      continue;
    }
    if (c === '"') return [out, j + 1];
    out += c;
    j += 1;
  }
}

// ---------------------------------------------------------------------------
// Frontmatter parser — accepts exactly the canonical grammar (render.ts
// output), key order aside. Blank lines between entries and trailing
// whitespace are tolerated; every other deviation throws. One flat level
// of nesting: a `key:` block is either a list of flat mappings (tiers,
// proof), a flat mapping whose values are scalars (period, marketing), or
// empty (rejected downstream as a value matter, not a grammar one).

// ---------------------------------------------------------------------------

const KEY_LINE = /^([A-Za-z_][A-Za-z0-9_]*):(?: (.*))?$/;
const NESTED_KEY_LINE = /^ {2}([A-Za-z_][A-Za-z0-9_]*): (.*)$/;
const NESTED_KEY_LINE_EMPTY = /^ {2}([A-Za-z_][A-Za-z0-9_]*):$/;
const ITEM_KEY_LINE = /^ {4}([A-Za-z_][A-Za-z0-9_]*): (.*)$/;

function parseScalar(raw: string, at: string): string | number {
  const v = raw.trim();
  if (v.startsWith('"')) {
    const [value, end] = readQuoted(v, 0, at);
    if (end !== v.length) throw new DefFormatError(`${at}: junk after closing quote`);
    return value;
  }
  if (/^-?\d+$/.test(v)) {
    const n = Number(v);
    // beyond 2^53 the round-trip loses precision and the renderer would
    // emit scientific notation the grammar cannot parse back
    if (!Number.isSafeInteger(n)) {
      throw new DefFormatError(`${at}: integer '${v}' exceeds the safe range`);
    }
    return n;
  }
  // legacy tolerance: the pre-canonical wizard emitted bare enum tokens
  // (schema, kind, proof.kind) instead of quoting them
  if (/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(v)) return v;
  throw new DefFormatError(
    `${at}: unsupported value '${v}' — the grammar has quoted strings and bare integers only`,
  );
}

/** Parse the frontmatter block into an untyped tree; typed extraction
 * (with unknown-key rejection) follows. */
function parseTree(fm: string): Record<string, unknown> {
  const lines = fm.split("\n").map((line) => line.replace(/[ \t]+$/, ""));
  let i = 0;

  /** Skip blank lines; i lands on the next meaningful line or EOF. */
  const sync = (): void => {
    while (i < lines.length && lines[i].trim() === "") i += 1;
  };

  /** `- ` items at 2-space indent — mapping items (tiers, proof). Stops at
   * the first non-item line. */
  const parseList = (): unknown[] => {
    const items: unknown[] = [];
    while (true) {
      sync();
      if (i >= lines.length) break;
      const line = lines[i];
      if (!line.startsWith("  - ")) break;
      const at = `line ${i + 1}`;
      i += 1; // consume the marker line
      const after = line.slice(4);
      // mapping item: first key rides the marker line, more keys at 4-space indent
      const m = KEY_LINE.exec(after);
      if (m === null) throw new DefFormatError(`${at}: bad list item`);
      if ((m[2] ?? "") === "") throw new DefFormatError(`${at}: empty list-item value`);
      const item: Record<string, unknown> = {};
      item[m[1]] = parseScalar(m[2], at);
      while (true) {
        sync();
        if (i >= lines.length) break;
        const cont = lines[i];
        if (!cont.startsWith("    ")) break;
        const cat = `line ${i + 1}`;
        const cm = ITEM_KEY_LINE.exec(cont);
        if (cm === null) throw new DefFormatError(`${cat}: bad list-item key line`);
        if (cm[1] in item) throw new DefFormatError(`${cat}: duplicate key '${cm[1]}'`);
        item[cm[1]] = parseScalar(cm[2], cat);
        i += 1;
      }
      items.push(item);
    }
    return items;
  };

  /** `key: value` lines at 2-space indent. */
  const parseNestedMapping = (): Record<string, unknown> => {
    const map: Record<string, unknown> = {};
    while (true) {
      sync();
      if (i >= lines.length) break;
      const line = lines[i];
      if (!line.startsWith("  ") || line.startsWith("  - ")) break;
      const at = `line ${i + 1}`;
      const empty = NESTED_KEY_LINE_EMPTY.exec(line);
      if (empty !== null) {
        if (empty[1] in map) throw new DefFormatError(`${at}: duplicate key '${empty[1]}'`);
        i += 1;
        map[empty[1]] = parseList();
        continue;
      }
      const m = NESTED_KEY_LINE.exec(line);
      if (m === null) throw new DefFormatError(`${at}: bad mapping line`);
      if (m[1] in map) throw new DefFormatError(`${at}: duplicate key '${m[1]}'`);
      map[m[1]] = parseScalar(m[2], at);
      i += 1;
    }
    return map;
  };

  /** The block under a value-less `key:` line: a list, a mapping, or —
   * when the next meaningful line dedents — an empty list. */
  const parseBlock = (): unknown => {
    sync();
    if (i >= lines.length) return [];
    const line = lines[i];
    if (line.startsWith("  - ")) return parseList();
    if (/^ {2}\S/.test(line)) return parseNestedMapping();
    return [];
  };

  const root: Record<string, unknown> = {};
  while (true) {
    sync();
    if (i >= lines.length) break;
    const line = lines[i];
    const at = `line ${i + 1}`;
    if (/^\s/.test(line)) throw new DefFormatError(`${at}: unexpected indentation`);
    const m = KEY_LINE.exec(line);
    if (m === null) throw new DefFormatError(`${at}: not a 'key: value' line`);
    if (m[1] in root) throw new DefFormatError(`${at}: duplicate key '${m[1]}'`);
    const rest = m[2] ?? "";
    i += 1; // consume the key line
    root[m[1]] = rest === "" ? parseBlock() : parseScalar(rest, at);
  }
  return root;
}

// ---------------------------------------------------------------------------
// Typed extraction — missing required keys, unknown keys, wrong types throw.
// ---------------------------------------------------------------------------

function asString(v: unknown, path: string): string {
  if (typeof v !== "string") throw new DefFormatError(`${path}: expected a quoted string`);
  return v;
}

function asInt(v: unknown, path: string): number {
  if (typeof v !== "number" || !Number.isInteger(v)) {
    throw new DefFormatError(`${path}: expected a bare integer`);
  }
  return v;
}

function asRecord(v: unknown, path: string): Record<string, unknown> {
  if (typeof v !== "object" || v === null || Array.isArray(v)) {
    throw new DefFormatError(`${path}: expected a mapping`);
  }
  return v as Record<string, unknown>;
}

function requireKey(record: Record<string, unknown>, key: string, path: string): unknown {
  if (record[key] === undefined) throw new DefFormatError(`${path}: missing required key`);
  return record[key];
}

function rejectUnknown(
  record: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
): void {
  for (const key of Object.keys(record)) {
    if (!allowed.includes(key)) throw new DefFormatError(`${path}: unknown key '${key}'`);
  }
}

const PERIOD_KEYS = ["start", "end", "claims_close", "venue"] as const;
const TIER_KEYS = ["name", "fee", "cap"] as const;
const PROOF_KEYS = ["slot", "kind", "label", "verify"] as const;
const MARKETING_KEYS = [
  "headline",
  "blurb",
  "logo",
  "share",
  "event",
  "smallestPayout",
  "smallest_payout", // legacy wizard spelling
] as const;
const TOP_KEYS = [
  "schema",
  "kind",
  "slug",
  "name",
  "period",
  "tiers",
  "proof",
  "marketing",
  "language",
] as const;

/** Parse the frontmatter block (splitDefDocument's `frontmatter`, not the
 * whole doc) into the typed machine block. Throws DefFormatError on any
 * structural deviation; value semantics are validate.ts's job. */
export function parseFrontmatter(fm: string): DefFrontmatter {
  const tree = parseTree(fm);
  rejectUnknown(tree, TOP_KEYS, "frontmatter");

  const periodTree = asRecord(requireKey(tree, "period", "period"), "period");
  rejectUnknown(periodTree, PERIOD_KEYS, "period");
  const period: DefPeriod = {
    start: asString(requireKey(periodTree, "start", "period.start"), "period.start"),
    end: asString(requireKey(periodTree, "end", "period.end"), "period.end"),
    claims_close: asString(
      requireKey(periodTree, "claims_close", "period.claims_close"),
      "period.claims_close",
    ),
  };
  if (periodTree.venue !== undefined) {
    period.venue = asString(periodTree.venue, "period.venue");
  }

  if (!Array.isArray(tree.tiers)) throw new DefFormatError("tiers: expected a list");
  const tiers: DefTier[] = tree.tiers.map((t, n) => {
    const tierTree = asRecord(t, `tiers[${n}]`);
    rejectUnknown(tierTree, TIER_KEYS, `tiers[${n}]`);
    return {
      name: asString(requireKey(tierTree, "name", `tiers[${n}].name`), `tiers[${n}].name`),
      fee: asInt(requireKey(tierTree, "fee", `tiers[${n}].fee`), `tiers[${n}].fee`),
      cap: asInt(requireKey(tierTree, "cap", `tiers[${n}].cap`), `tiers[${n}].cap`),
    };
  });

  if (!Array.isArray(tree.proof)) throw new DefFormatError("proof: expected a list");
  const proof: DefProofSlot[] = tree.proof.map((p, n) => {
    const slotTree = asRecord(p, `proof[${n}]`);
    rejectUnknown(slotTree, PROOF_KEYS, `proof[${n}]`);
    const slot: DefProofSlot = {
      slot: asString(requireKey(slotTree, "slot", `proof[${n}].slot`), `proof[${n}].slot`),
      kind: asString(
        requireKey(slotTree, "kind", `proof[${n}].kind`),
        `proof[${n}].kind`,
      ) as DefProofKind,
    };
    if (slotTree.label !== undefined) {
      slot.label = asString(slotTree.label, `proof[${n}].label`);
    }
    if (slotTree.verify !== undefined) {
      slot.verify = asString(slotTree.verify, `proof[${n}].verify`);
    }
    return slot;
  });

  let marketing: DefMarketing | undefined;
  if (tree.marketing !== undefined) {
    const mTree = asRecord(tree.marketing, "marketing");
    rejectUnknown(mTree, MARKETING_KEYS, "marketing");
    marketing = {};
    for (const key of ["headline", "blurb", "logo", "share", "event"] as const) {
      if (mTree[key] !== undefined) {
        marketing[key] = asString(mTree[key], `marketing.${key}`);
      }
    }
    const smallest = mTree.smallestPayout ?? mTree.smallest_payout;
    if (smallest !== undefined) {
      marketing.smallestPayout = asInt(smallest, "marketing.smallestPayout");
    }
  }

  return {
    schema: asString(requireKey(tree, "schema", "schema"), "schema"),
    kind: asString(requireKey(tree, "kind", "kind"), "kind") as PoolKind,
    slug: asString(requireKey(tree, "slug", "slug"), "slug"),
    name: asString(requireKey(tree, "name", "name"), "name"),
    period,
    tiers,
    proof,
    marketing,
    language: tree.language === undefined ? "en" : asString(tree.language, "language"),
  };
}

// ---------------------------------------------------------------------------
// Def-resolution bridge (epic riprap-hs4r): the store/page entry point.
// The grammar stays the canonical one above — render.ts's inverse — so a
// listed community def is always an artifact the full validate.ts matrix
// can check; the gates below are the shape-level drop rules the
// def-resolution surfaces own. Null is a state ("not a def"), never a
// throw — usePoolDef/store drop on it.
// ---------------------------------------------------------------------------

/** `kind` — a copy-selector enum only; nothing mechanical differs (D8). */
export type DefKind = PoolKind;

/** A parsed riprap-def/v1 doc: the machine block plus the free-form body
 * markdown (sections.ts reads headings out of it). */
export interface RiprapDef extends DefFrontmatter {
  body: string;
}

/** Legacy wizard docs carried 10 §s (exclusions in §3): renumber them onto
 *  the canonical 11-§ skeleton with an empty §4 so §-number reads line up.
 *  Hash-anchored bytes never change — only the parsed view. */
function canonicalizeLegacyBody(body: string): string {
  if ((body.match(/^## \d+\. /gm) ?? []).length !== 10) return body;
  return body
    .replace(/^## (10|[4-9])\. /gm, (_, n: string) => `## ${Number(n) + 1}. `)
    .replace(/^## 5\. /m, "## 4. Exclusions\n\n## 5. ");
}

/** CAS bytes → a def, or null when the bytes are not canonical
 * riprap-def/v1 (grammar, schema tag, kind enum, or the shape-level pool
 * facts: 1–3 positive tiers, at least one proof slot). */
export function parseDefDoc(doc: string): RiprapDef | null {
  let fm: DefFrontmatter;
  let body: string;
  try {
    const split = splitDefDocument(doc);
    fm = parseFrontmatter(split.frontmatter);
    body = canonicalizeLegacyBody(split.body);
  } catch {
    return null;
  }
  if (fm.schema !== DEF_SCHEMA) return null;
  if (fm.kind !== "mutual" && fm.kind !== "bounty") return null;
  if (fm.slug.length === 0 || fm.name.trim() === "") return null;
  if (fm.tiers.length < 1 || fm.tiers.length > 3) return null;
  if (fm.tiers.some((t) => !(t.fee > 0) || !(t.cap > 0))) return null;
  if (fm.proof.length < 1) return null;
  return { ...fm, body };
}
