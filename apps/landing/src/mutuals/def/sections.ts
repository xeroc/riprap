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
