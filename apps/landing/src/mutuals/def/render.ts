// riprap-def/v1 — the canonical renderer: DefInput → the deterministic
// artifact bytes (milestone D1/D2). One markdown file: YAML frontmatter
// (fixed key order, stable whitespace, no timestamps — schema.ts's
// grammar is the inverse) + the author's free-form body. Same DefInput,
// same bytes: `sha256(utf8(doc))` must reproduce months later, so nothing
// environment-derived ever enters the output.
//
// The body is the author's whole policy, frontmatter excluded. It may be
// anything — markdown, prose, an empty string — and is never validated or
// interpreted here. The renderer only guards the machine block (tiers,
// proof) so a non-renderable artifact cannot be hashed.
//
// Pure module: no UI, no chain, no daemon calls.

import { DEF_SCHEMA, type DefFrontmatter, dq } from "./schema";

/** The wizard's authoring input: the machine block (frontmatter minus the
 *  auto-stamped `schema`; `language` defaults to "en") plus the free-form
 *  markdown body. */
export type DefInput = Omit<DefFrontmatter, "schema" | "language"> & {
  language?: string;
  /** The whole user-authored policy, frontmatter excluded. Markdown. */
  body: string;
};

/** Render the deterministic artifact: the frontmatter, a blank line, then
 *  the body verbatim (newlines normalized, edge whitespace trimmed). Throws
 *  only on machine-block fields the on-chain deploy cannot represent — the
 *  body is never inspected. */
export function renderDef(input: DefInput): string {
  if (input.tiers.length === 0) throw new Error("renderDef: at least one tier is required");
  for (const tier of input.tiers) {
    for (const [field, value] of [
      ["fee", tier.fee],
      ["cap", tier.cap],
    ] as const) {
      if (!Number.isSafeInteger(value)) {
        throw new Error(`renderDef: tier '${tier.name}' ${field} must be a safe integer`);
      }
    }
  }
  if (input.proof.length === 0) throw new Error("renderDef: at least one proof slot is required");

  const body = input.body.replace(/\r\n?/g, "\n").trim();
  return `${renderFrontmatter(input)}${body === "" ? "" : `${body}\n`}`;
}

// ---------------------------------------------------------------------------
// Frontmatter — fixed key order, strings always double-quoted, integers
// bare; exactly the grammar schema.ts parses.

function renderFrontmatter(input: DefInput): string {
  const lines: string[] = ["---"];
  lines.push(`schema: ${dq(DEF_SCHEMA)}`);
  lines.push(`kind: ${dq(input.kind)}`);
  lines.push(`slug: ${dq(input.slug)}`);
  lines.push(`name: ${dq(input.name)}`);
  lines.push("period:");
  lines.push(`  start: ${dq(input.period.start)}`);
  lines.push(`  end: ${dq(input.period.end)}`);
  lines.push(`  claims_close: ${dq(input.period.claims_close)}`);
  if (input.period.venue !== undefined) lines.push(`  venue: ${dq(input.period.venue)}`);
  lines.push("tiers:");
  for (const tier of input.tiers) {
    lines.push(`  - name: ${dq(tier.name)}`);
    lines.push(`    fee: ${tier.fee}`);
    lines.push(`    cap: ${tier.cap}`);
  }
  lines.push("proof:");
  for (const slot of input.proof) {
    lines.push(`  - slot: ${dq(slot.slot)}`);
    lines.push(`    kind: ${dq(slot.kind)}`);
    if (slot.label !== undefined) lines.push(`    label: ${dq(slot.label)}`);
    if (slot.verify !== undefined) lines.push(`    verify: ${dq(slot.verify)}`);
  }
  const marketing = renderMarketing(input.marketing);
  if (marketing.length > 0) {
    lines.push("marketing:");
    lines.push(...marketing);
  }
  lines.push(`language: ${dq(input.language ?? "en")}`);
  lines.push("---", "");
  return `${lines.join("\n")}\n`;
}

function renderMarketing(marketing: DefInput["marketing"]): string[] {
  if (marketing === undefined) return [];
  const lines: string[] = [];
  if (marketing.headline !== undefined) lines.push(`  headline: ${dq(marketing.headline)}`);
  if (marketing.blurb !== undefined) lines.push(`  blurb: ${dq(marketing.blurb)}`);
  if (marketing.logo !== undefined) lines.push(`  logo: ${dq(marketing.logo)}`);
  if (marketing.share !== undefined) lines.push(`  share: ${dq(marketing.share)}`);
  if (marketing.event !== undefined) lines.push(`  event: ${dq(marketing.event)}`);
  if (marketing.smallestPayout !== undefined) {
    lines.push(`  smallestPayout: ${marketing.smallestPayout}`);
  }
  return lines;
}
