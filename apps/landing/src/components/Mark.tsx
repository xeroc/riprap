// The stone mark, verbatim from meta/marketing/07-brand-assets/logo/mark.svg
// (7 grey stones in 2 courses + the harbor-blue crest stone — 8 total).
// Used as-is — never re-drawn, never restyled (visual-identity.md). The
// animated assemble beat lives in the kit: @riprap/ui MarkAssemble.
const STONES = [
  // bottom course
  "9,84 11.5,67 29,64.5 30.5,84",
  "33,84 32,61 50,58.5 52,84",
  "54.5,84 53.5,56 70,53.5 72,84",
  "74.5,84 75,51.5 90,49 92,84",
  // upper course
  "20,65.5 22.5,47.5 41,45.5 42,60",
  "45,59.5 46.8,42.5 64,40.5 66,55.8",
  "69,53.9 70.5,38.5 89,36.5 88,49.6",
] as const;

const CREST = "74,38.3 75.5,22 92,20.5 92.5,37.2";

export function Mark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 96 96"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <g fill="#A7ADB3">
        {STONES.map((points) => (
          <polygon key={points} points={points} />
        ))}
      </g>
      <polygon fill="#3E7CA6" points={CREST} />
    </svg>
  );
}
