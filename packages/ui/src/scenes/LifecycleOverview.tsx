import { Arrow } from "../atoms/Arrow";
import { SvgFrame, SvgText } from "../atoms/SvgFrame";
import { usd } from "../lib/poolMath";
import { moneyY, steppedPath } from "../lib/trace";
import { MonoLine, SceneTitle } from "./Panel";

/**
 * Scene 4 — whole-lifecycle overview (composition.md § scene templates,
 * 1200×420). Eight numbered chips (step 3 dashed = optional; step 5 carries
 * the mini commit-reveal glyph) above the balance trace: pool-with-level
 * flattened into a line on the shared money scale — rises to the recruited
 * balance, drops at payout, drops to $0 at refund, flat through dissolve.
 */
export interface LifecycleOverviewProps {
  /** recruited balance (step 2 peak) */
  poolBalance?: number;
  /** balance after claims paid (step 6) */
  afterClaims?: number;
  /** shared money scale (max fill = largest balance in the piece) */
  maxBalance?: number;
}

const STEPS = [
  { n: 1, label: "sponsor", second: "founds", optional: false },
  { n: 2, label: "members join", second: null, optional: false },
  { n: 3, label: "juror opt-in", second: "(optional)", optional: true },
  { n: 4, label: "claim filed", second: null, optional: false },
  { n: 5, label: "jurors rule", second: null, optional: false },
  { n: 6, label: "payout", second: null, optional: false },
  { n: 7, label: "refund crank", second: null, optional: false },
  { n: 8, label: "dissolve", second: null, optional: false },
] as const;

const CHIP_W = 124;
const CHIP_H = 64;
const CHIP_GAP = 16;
const TRACE_BASE = 360;
const TRACE_TOP = 240;

export function LifecycleOverview({
  poolBalance = 20000,
  afterClaims = 12000,
  maxBalance = 20000,
}: LifecycleOverviewProps) {
  const yPool = moneyY(poolBalance, maxBalance, TRACE_BASE, TRACE_TOP);
  const yClaims = moneyY(afterClaims, maxBalance, TRACE_BASE, TRACE_TOP);
  const trace = steppedPath([
    { x: 40, y: TRACE_BASE },
    { x: 172, y: TRACE_BASE },
    { x: 172, y: yPool },
    { x: 732, y: yPool },
    { x: 732, y: yClaims },
    { x: 872, y: yClaims },
    { x: 872, y: TRACE_BASE },
    { x: 1160, y: TRACE_BASE },
  ]);
  const points = [
    { x: 242, y: yPool, label: usd(poolBalance) },
    { x: 802, y: yClaims, label: usd(afterClaims) },
    { x: 942, y: TRACE_BASE, label: "$0" },
  ];

  return (
    <SvgFrame
      width={1200}
      height={420}
      title="Riprap lifecycle"
      desc="Eight lifecycle steps as chips — sponsor founds, members join, juror opt-in (optional), claim filed, jurors rule, payout, refund crank, dissolve — above a balance trace rising to the recruited pool, dropping after claims, and ending at zero."
    >
      <SceneTitle title="Riprap lifecycle" />
      <MonoLine
        x={40}
        y={88}
        size={13}
        fill="var(--riprap-diagram-muted)"
        segments={[
          {
            text: "one pool, one peril, one event — collect, adjudicate, disburse, dissolve",
            mono: false,
          },
        ]}
      />

      {/* step chips */}
      {STEPS.map((s, i) => {
        const cx = 40 + i * (CHIP_W + CHIP_GAP);
        return (
          <g key={s.n}>
            <rect
              x={cx}
              y={110}
              width={CHIP_W}
              height={CHIP_H}
              rx={12}
              fill="var(--riprap-diagram-canvas)"
              stroke={s.optional ? "var(--riprap-diagram-muted)" : "var(--riprap-diagram-line)"}
              strokeWidth={3}
              strokeDasharray={s.optional ? "8 6" : undefined}
            />
            <SvgText x={cx + 12} y={136} size={16} fill="var(--riprap-diagram-ink)" bold mono>
              {String(s.n)}
            </SvgText>
            <SvgText
              x={cx + 62}
              y={s.second ? 142 : 148}
              size={13}
              fill="var(--riprap-diagram-ink)"
              anchor="middle"
            >
              {s.label}
            </SvgText>
            {s.second ? (
              <SvgText
                x={cx + 62}
                y={158}
                size={13}
                fill="var(--riprap-diagram-muted)"
                anchor="middle"
              >
                {s.second}
              </SvgText>
            ) : null}
            {i < STEPS.length - 1 ? (
              <Arrow
                x1={cx + CHIP_W}
                y1={142}
                x2={cx + CHIP_W + CHIP_GAP - 4}
                y2={142}
                color="var(--riprap-diagram-ink)"
              />
            ) : null}
            {/* step 5 carries the mini commit-reveal glyph */}
            {s.n === 5 ? (
              <g>
                <rect
                  x={cx + 20}
                  y={150}
                  width={20}
                  height={16}
                  rx={4}
                  fill="none"
                  stroke="var(--riprap-diagram-ink)"
                  strokeWidth={3}
                />
                <rect
                  x={cx + 84}
                  y={150}
                  width={20}
                  height={16}
                  rx={4}
                  fill="none"
                  stroke="var(--riprap-diagram-ink)"
                  strokeWidth={3}
                />
                <Arrow
                  x1={cx + 44}
                  y1={158}
                  x2={cx + 80}
                  y2={158}
                  color="var(--riprap-deliberation)"
                />
              </g>
            ) : null}
          </g>
        );
      })}

      {/* the balance trace — pool-with-level over time, same binding */}
      <line
        x1={40}
        y1={TRACE_BASE}
        x2={1160}
        y2={TRACE_BASE}
        stroke="var(--riprap-diagram-line)"
        strokeWidth={3}
      />
      <path d={trace} fill="none" stroke="var(--riprap-funds)" strokeWidth={3} />
      {points.map((p) => (
        <g key={p.label}>
          <circle cx={p.x} cy={p.y} r={5} fill="var(--riprap-funds)" />
          <SvgText
            x={p.x}
            y={p.y === TRACE_BASE ? p.y + 24 : p.y - 14}
            size={16}
            fill="var(--riprap-funds-ink)"
            mono
            anchor="middle"
          >
            {p.label}
          </SvgText>
        </g>
      ))}
      <MonoLine
        x={40}
        y={404}
        size={13}
        fill="var(--riprap-diagram-muted)"
        segments={[
          { text: "balance trace — worked example: ", mono: false },
          { text: "1,000", mono: true },
          { text: " members × ", mono: false },
          { text: "$20", mono: true },
          { text: " (Standard) · ", mono: false },
          { text: "4", mono: true },
          { text: " claims × ", mono: false },
          { text: "$2,000", mono: true },
          { text: " paid · ", mono: false },
          { text: "$12,000", mono: true },
          { text: " refunded (", mono: false },
          { text: "$12", mono: true },
          { text: " each) · dissolved at ", mono: false },
          { text: "$0", mono: true },
        ]}
      />
    </SvgFrame>
  );
}
