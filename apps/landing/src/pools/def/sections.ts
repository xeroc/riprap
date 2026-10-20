// riprap-def/v1 — the markdown heading layer. New defs are free-form: the
// body is the author's whole policy, and only two lookups are ever made —
// the legacy numbered `## N. Title` blocks (first-party 11-§ docs and
// pre-canonical wizard drafts) and a title-matched `## Exclusions` block.
// Everything else is rendered as the body.
//
// Pure module: no UI, no chain, no daemon calls.

/** One `## N. Title` block; `body` is the section's markdown with edge
 * whitespace and the canonical `---` separator stripped (whitespace inside
 * survives verbatim). */
export interface DefSection {
  number: number;
  title: string;
  body: string;
}

/** Parse a §-body (splitDefDocument's `body`) into its § blocks, in
 * document order. Legacy shape only: the first-party 11-§ docs and
 * pre-canonical wizard drafts. Mechanical and total: no headers → [].
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
function finishLines(lines: string[]): string {
  const out = [...lines];
  while (out.length > 0 && out[out.length - 1].trim() === "") out.pop();
  if (out.length > 0 && out[out.length - 1].trim() === "---") out.pop();
  while (out.length > 0 && out[out.length - 1].trim() === "") out.pop();
  return out.join("\n").trim();
}

function finish(section: { number: number; title: string; lines: string[] }): DefSection {
  return {
    number: section.number,
    title: section.title,
    body: finishLines(section.lines),
  };
}

/** One `## Heading` block — the free-form body's section shape. `title`
 *  keeps any ordinal the author wrote (`4. Exclusions`), so a caller
 *  matching a title must not care about the number. */
export interface HeadingSection {
  title: string;
  body: string;
}

const HEADING = /^##\s+(.+?)\s*$/;
const FENCE = /^\s*(?:```|~~~)/;

/** Parse a markdown body into its `##` blocks, in document order. Headings
 *  inside fenced code blocks are content, not sections. `body` is trimmed
 *  with the canonical `---` separator stripped, same as parseSections. */
export function parseHeadings(body: string): HeadingSection[] {
  const sections: HeadingSection[] = [];
  let current: { title: string; lines: string[] } | null = null;
  let fenced = false;

  for (const line of body.split("\n")) {
    if (FENCE.test(line)) {
      fenced = !fenced;
      current?.lines.push(line);
      continue;
    }
    const match = fenced ? null : HEADING.exec(line);
    if (match !== null) {
      if (current !== null) sections.push(finishHeading(current));
      current = { title: (match[1] ?? "").replace(/\s+#+\s*$/, ""), lines: [] };
    } else if (current !== null) {
      current.lines.push(line);
    }
  }
  if (current !== null) sections.push(finishHeading(current));
  return sections;
}

function finishHeading(section: { title: string; lines: string[] }): HeadingSection {
  return { title: section.title, body: finishLines(section.lines) };
}

/** The first `##` block whose title matches `pattern`, or null. */
export function sectionByHeading(body: string, pattern: RegExp): HeadingSection | null {
  return parseHeadings(body).find((section) => pattern.test(section.title)) ?? null;
}

// ---------------------------------------------------------------------------
// Access helpers — the legacy doc-band reads: § lookup by number and the
// markdown extractions (paragraphs, list items, quote lines) the generic
// page, the listing, and the packs derive from. New defs are free-form;
// these reads only find content when the author kept the old § shape.
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
 *  the legacy §3 definition notes and §4 exclusions. */
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
