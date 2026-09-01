import { STONE_SIZES, type StoneSize } from "../lib/stone";
import { Arrow } from "./Arrow";
import { MemberStone } from "./MemberStone";
import { SvgText } from "./SvgFrame";

/**
 * Atom: juror-draw — the lottery: N stones pulled at random from the staked
 * pile, weighted by what they put in. meta/primitives/atoms/juror-draw.md.
 *
 * The pile must show (a jury floating in space hides that jurors ARE
 * members); only ringed stones are eligible; drawn stones are promoted to
 * full opacity + deliberation fill + dashed selection ring, stepping out of
 * the pile toward the focal side. N = `{{N_JURORS}}` until a pool fixes it
 * (3 is the canonical first-round value).
 */
export interface JurorDrawProps {
  x: number;
  y: number;
  /** drawn juror count — undefined prints `{{N_JURORS}}` */
  jurorCount?: number;
  /** drawn size classes — non-uniform mix (uniform reads as rigged) */
  drawnSizes?: StoneSize[];
}

/** Backdrop pile: 12 anonymous members at 40% opacity, 3 of them ringed. */
const PILE: { x: number; y: number; size: StoneSize; ring: boolean }[] = [
  { x: 0.12, y: 0.72, size: "S", ring: false },
  { x: 0.28, y: 0.86, size: "M", ring: true },
  { x: 0.4, y: 0.66, size: "S", ring: false },
  { x: 0.52, y: 0.9, size: "S", ring: false },
  { x: 0.62, y: 0.7, size: "M", ring: false },
  { x: 0.74, y: 0.88, size: "S", ring: true },
  { x: 0.16, y: 0.48, size: "M", ring: false },
  { x: 0.34, y: 0.42, size: "S", ring: false },
  { x: 0.5, y: 0.5, size: "L", ring: true },
  { x: 0.66, y: 0.44, size: "S", ring: false },
  { x: 0.82, y: 0.6, size: "M", ring: false },
  { x: 0.44, y: 0.28, size: "S", ring: false },
];

export function JurorDraw({ x, y, jurorCount, drawnSizes = ["M", "S", "L"] }: JurorDrawProps) {
  const n = jurorCount ?? drawnSizes.length;
  const w = 344;
  const nLabel = jurorCount === undefined ? "{{N_JURORS}}" : String(jurorCount);

  return (
    <g>
      {/* the Subaccord population — ringed stones only are eligible */}
      <g opacity={0.4}>
        {PILE.map((p, i) => {
          const px = x + Math.round((p.x * w) / 4) * 4;
          const py = y + 72 + Math.round((p.y * 100) / 4) * 4;
          return (
            <g key={i}>
              <MemberStone size={p.size} seed={30 + i} x={px} y={py} />
              {p.ring ? (
                <circle
                  cx={px}
                  cy={py}
                  r={STONE_SIZES[p.size] / 2 + 8}
                  fill="none"
                  stroke="var(--riprap-deliberation)"
                  strokeWidth={3}
                />
              ) : null}
            </g>
          );
        })}
      </g>

      {/* the drawn set — promoted, pulled out toward the focal side */}
      {Array.from({ length: n }, (_, i) => {
        const size = drawnSizes[i % drawnSizes.length];
        const dx = x + w - 104 + (i % 2) * 48;
        const dy = y + 112 + i * 44;
        return (
          <g key={i}>
            <MemberStone
              size={size}
              seed={90 + i}
              x={dx}
              y={dy}
              fillColor="var(--riprap-deliberation)"
            />
            <circle
              cx={dx}
              cy={dy}
              r={STONE_SIZES[size] / 2 + 10}
              fill="none"
              stroke="var(--riprap-deliberation)"
              strokeWidth={3}
              strokeDasharray="6 6"
            />
          </g>
        );
      })}

      {/* VRF tag — the randomness is external and on-chain */}
      <rect
        x={x + w - 96}
        y={y + 16}
        width={104}
        height={26}
        rx={12}
        fill="none"
        stroke="var(--riprap-deliberation)"
        strokeWidth={3}
      />
      <SvgText x={x + w - 84} y={y + 34} size={13} fill="var(--riprap-deliberation)">
        VRF draw
      </SvgText>
      <Arrow
        x1={x + w - 44}
        y1={y + 46}
        x2={x + w - 64}
        y2={y + 76}
        color="var(--riprap-deliberation)"
      />
      <SvgText x={x + 16} y={y + 56} size={13} fill="var(--riprap-diagram-muted)" mono>
        {`N = ${nLabel}`}
      </SvgText>
      <SvgText x={x + 16} y={y + 212} size={13} fill="var(--riprap-diagram-muted)">
        selection weighted by stake
      </SvgText>
    </g>
  );
}
