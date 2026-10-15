// riprap-def/v1 — the §-section layer: the fixed 11-§ header map (the
// kind word-maps, milestone D2) and the inverse §-parser (body markdown
// → § blocks) that feeds the def-resolution surfaces' doc bands. The
// header inventory mirrors the first-party terms docs (Micro Mutual /
// Micro Bounty, §1–§11); only the kind-varying titles swap:
// Coverage Period/Bounty Period, Covered Event/Qualifying Delivery,
// Coverage and Price/Bounty and Price, Pool/The Pot, Payout
// Requests/Claims, Pool Dissolution/Winding Up.
//
// Pure module: no UI, no chain, no daemon calls.

import type { PoolKind } from "../types";

/** The terms body's fixed section count (§1–§11). */
export const SECTION_COUNT = 11;

/** The 11 section titles in § order, for one kind. */
export function sectionTitles(kind: PoolKind): string[] {
  return kind === "mutual"
    ? [
        "Product",
        "Coverage Period",
        "Covered Event",
        "Exclusions",
        "Coverage and Price",
        "Pool",
        "Payout Requests",
        "Pool Dissolution",
        "Economic Principle",
        "Example",
        "Product Promise",
      ]
    : [
        "Product",
        "Bounty Period",
        "Qualifying Delivery",
        "Exclusions",
        "Bounty and Price",
        "The Pot",
        "Claims",
        "Winding Up",
        "Economic Principle",
        "Example",
        "Product Promise",
      ];
}

/** One `## N. Title` block; `body` is the section's markdown with edge
 * whitespace and the canonical `---` separator stripped (whitespace inside
 * survives verbatim). */
export interface DefSection {
  number: number;
  title: string;
  body: string;
}

/** Parse a §-body (splitDefDocument's `body`) into its § blocks, in
 * document order. Mechanical and total: no headers → []; header numbers
 * and titles are returned as found — structural expectations (11 §s,
 * kind-matching titles) are validate.ts's job, not this parser's.
 */
const SECTION_HEADER = /^## (\d{1,2})\. (.*)$/;

export function parseSections(body: string): DefSection[] {
  const sections: DefSection[] = [];
  let current: { number: number; title: string; lines: string[] } | null = null;

  for (const line of body.split("\n")) {
    const m = SECTION_HEADER.exec(line);
    if (m !== null) {
      if (current !== null) sections.push(finish(current));
      current = { number: Number(m[1]), title: m[2], lines: [] };
    } else if (current !== null) {
      current.lines.push(line);
    }
  }
  if (current !== null) sections.push(finish(current));
  return sections;
}

/** Trim trailing blanks and the canonical `---` section separator off a
 * section's collected lines. */
function finish(section: { number: number; title: string; lines: string[] }): DefSection {
  const lines = [...section.lines];
  while (lines.length > 0 && lines[lines.length - 1].trim() === "") lines.pop();
  if (lines.length > 0 && lines[lines.length - 1].trim() === "---") lines.pop();
  while (lines.length > 0 && lines[lines.length - 1].trim() === "") lines.pop();
  return { number: section.number, title: section.title, body: lines.join("\n").trim() };
}

// ---------------------------------------------------------------------------
// §-access helpers (epic riprap-hs4r) — the doc-band reads: § lookup by
// number and the markdown extractions (paragraphs, list items, quote
// lines, bold lines) the generic page, the listing, and the packs derive
// from. Sections are keyed by number, never title: the two kind word-maps
// name the same § differently, so consumers cite §3/§4/§5/§7/§8/§10/§11
// by number, per the first-party docs' shared skeleton.
// ---------------------------------------------------------------------------

/** The § block by number (null when the doc doesn't carry it). */
export function sectionByNo(sections: DefSection[], no: number): DefSection | null {
  return sections.find((s) => s.number === no) ?? null;
}

/** Strip the markdown the doc bands don't re-render: bold/emphasis markers
 *  and blockquote fences (line-oriented, so multi-line paragraphs work). */
export function stripMd(text: string): string {
  return text
    .replace(/\*\*|\*|__/g, "")
    .replace(/(^|\n)> ?/g, "$1")
    .trim();
}

/** Blank-line-separated paragraphs of a § body, markdown stripped, empty
 *  paragraphs dropped. A paragraph that is a list renders as one entry per
 *  item (see listItems). */
export function paragraphs(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((p) => stripMd(p))
    .filter((p) => p.length > 0);
}

/** List items (`- …` or `1. …`) of a § body, in order, markdown stripped —
 *  the §3 definition notes, the §4 exclusions, the §11 promise lines. */
export function listItems(body: string): string[] {
  const items: string[] = [];
  for (const line of body.split("\n")) {
    const item = /^\s*(?:[-*]|\d+\.)\s+(.*)$/.exec(line);
    if (item !== null) {
      const text = stripMd(item[1] ?? "");
      if (text.length > 0) items.push(text);
    }
  }
  return items;
}

/** The § body's blockquote lines (`> …`), stripped — the §3 definition's
 *  verbatim quote shape. */
export function quoteLines(body: string): string[] {
  return body
    .split("\n")
    .filter((line) => line.startsWith(">"))
    .map((line) => stripMd(line))
    .filter((line) => line.length > 0);
}

/** Lines that are exactly one bold span (`**…**`) — the §11 promise lines
 *  and the §10 example figures. */
export function boldLines(body: string): string[] {
  return body
    .split("\n")
    .map((line) => /^\*\*(.+)\*\*$/.exec(line.trim()))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => (m[1] ?? "").trim());
}
