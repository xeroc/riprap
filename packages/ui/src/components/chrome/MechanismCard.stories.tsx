import type { Meta, StoryObj } from "@storybook/react-vite";
import { MechanismCard } from "./MechanismCard";

/** Diagram slot demo — a minimal two-doors vessel drawn with diagram tokens
 * (meta/primitives grammar). Real usage passes a kit atom/scene. */
const TwoDoorsSketch = () => (
  <svg role="img" viewBox="0 0 240 120" width={240} height={120} aria-labelledby="sketch-title">
    <title id="sketch-title">vessel with exactly two doors</title>
    <path
      d="M20 20 h200 v60 a20 20 0 0 1 -20 20 h-160 a20 20 0 0 1 -20 -20 z"
      fill="none"
      stroke="var(--riprap-diagram-line)"
      strokeWidth={3}
      strokeLinejoin="round"
    />
    <path
      d="M20 40 h-14 M220 40 h14"
      stroke="var(--riprap-funds)"
      strokeWidth={3}
      strokeDasharray="6 6"
    />
    <text x={30} y={36} fill="var(--riprap-diagram-muted)" fontSize={9}>
      spending — adjudicated
    </text>
    <text x={130} y={36} fill="var(--riprap-diagram-muted)" fontSize={9}>
      liquidation
    </text>
  </svg>
);

const meta = {
  title: "Chrome/MechanismCard",
  component: MechanismCard,
  parameters: { layout: "centered" },
} satisfies Meta<typeof MechanismCard>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: {
    title: "two doors",
    children: <TwoDoorsSketch />,
  },
};
