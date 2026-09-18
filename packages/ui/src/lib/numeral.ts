/**
 * Numeral segmentation — DESIGN.md § Typography: "Every numeral renders in
 * JetBrains Mono — inline in body text too." Chrome components split their
 * prose through this helper and wrap the `numeral: true` segments in
 * `<span data-num className="font-mono">`.
 */

export interface NumeralSegment {
  text: string;
  /** true when this run is a numeral and must render mono */
  numeral: boolean;
}

/**
 * Runs of digits (with embedded `,` `.` separators) become numeral segments;
 * everything between stays prose. A run must end on a digit, so trailing
 * punctuation stays with the prose ("1,000 members" → ["1,000", " members"]).
 * Surrounding glyphs ("$", "%", "k", "T") stay in the prose segments.
 */
const NUMERAL = /(\d[\d.,]*\d|\d)/g;

export function numeralSegments(text: string): NumeralSegment[] {
  return text
    .split(NUMERAL)
    .filter((part) => part !== "")
    .map((part) => ({ text: part, numeral: /\d/.test(part) }));
}
