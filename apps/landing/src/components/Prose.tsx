// Body text with every numeral run in mono (DESIGN.md § Typography — the
// kit's numeralSegments does the splitting). Extracted from BlurbPage
// (2026-09-27) for reuse by the pool page bands; renders plain spans for
// prose runs and mono data-num spans for numeral runs.
import { numeralSegments } from "@riprap/ui";

export function Prose({ text }: { text: string }) {
  return (
    <>
      {numeralSegments(text).map((segment) =>
        segment.numeral ? (
          <span key={segment.text} data-num className="font-mono">
            {segment.text}
          </span>
        ) : (
          <span key={segment.text}>{segment.text}</span>
        ),
      )}
    </>
  );
}
