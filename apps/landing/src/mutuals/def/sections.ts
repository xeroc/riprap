// The inverse §-parser (def-format epic): a riprap-def/v1 body — 11 fixed
// `## N. Title` sections, titles kind-word-mapped by the renderer — back into
// § blocks the doc bands consume. Keyed by number, never title: the two kind
// word-maps name the same § differently (Covered Event vs Qualifying
// Delivery), so consumers cite §3/§4/§5/§7/§8/§10/§11 by number, per the
// first-party docs' shared skeleton.
export interface DefSection {
  no: number;
  title: string;
  body: string;
}

/** Body markdown → § blocks in document order; lines before the first `## N.`
 *  heading are dropped (the canonical renderer emits none). */
export function parseSections(body: string): DefSection[] {
  const sections: DefSection[] = [];
  const lines = body.split("\n");
  let current: DefSection | null = null;
  for (const line of lines) {
    const heading = /^## (\d{1,2})\. (.*)$/.exec(line);
    if (heading !== null) {
      if (current !== null) sections.push(current);
      current = { no: Number(heading[1]), title: heading[2].trim(), body: "" };
      continue;
    }
    if (current !== null) current.body += `${line}\n`;
  }
  if (current !== null) sections.push(current);
  return sections;
}

/** The § block by number (null when the doc doesn't carry it). */
export function sectionByNo(sections: DefSection[], no: number): DefSection | null {
  return sections.find((s) => s.no === no) ?? null;
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
