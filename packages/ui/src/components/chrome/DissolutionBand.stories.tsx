import type { Meta, StoryObj } from "@storybook/react-vite";
import { DissolutionBand } from "./DissolutionBand";

/** Scattered-mark stand-in — real usage passes the kit's DissolutionScatter. */
const ScatterMark = () => (
  <svg role="img" viewBox="0 0 160 40" width={160} height={40} aria-label="scattered stones">
    {[
      [10, 24],
      [38, 14],
      [64, 30],
      [92, 10],
      [118, 26],
      [142, 12],
    ].map(([x, y], i) => (
      <rect
        key={`${x}-${y}`}
        x={x}
        y={y}
        width={14}
        height={10}
        rx={2}
        fill={i === 5 ? "var(--riprap-accent)" : "var(--riprap-diagram-stone)"}
        stroke="var(--riprap-diagram-stone-edge)"
        strokeWidth={2}
        transform={`rotate(${i * 17} ${x + 7} ${y + 5})`}
      />
    ))}
  </svg>
);

const meta = {
  title: "Chrome/DissolutionBand",
  component: DissolutionBand,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof DissolutionBand>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: {
    remaining: 0,
    line: "Every claim paid. The crank returned the rest. The pool is closed.",
    mark: <ScatterMark />,
  },
};
