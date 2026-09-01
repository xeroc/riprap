import type { Meta, StoryObj } from "@storybook/react-vite";
import { SvgFrame } from "../atoms/SvgFrame";
import { WaveBreak } from "./WaveBreak";

type WaveBreakStoryProps = Parameters<typeof WaveBreak>[0];

const WaveBreakStory = (args: WaveBreakStoryProps) => (
  <SvgFrame
    width={360}
    height={240}
    title="WaveBreak"
    desc="One wave arrival that settles — the claims are the storm, the stones hold, then it clears. Honors prefers-reduced-motion by rendering the settled pile."
  >
    <WaveBreak {...args} />
  </SvgFrame>
);

const meta = {
  title: "Motion/WaveBreak",
  component: WaveBreakStory,
  parameters: { layout: "centered" },
} satisfies Meta<typeof WaveBreakStory>;

export default meta;

/** the law: ONE arrival, no loop (DESIGN.md — no oscillating loops by default) */
export const Default: StoryObj<typeof meta> = {
  args: {
    x: 80,
    y: 140,
  },
};

/** opt-in repeating hero */
export const Loop: StoryObj<typeof meta> = {
  args: {
    x: 80,
    y: 140,
    loop: true,
  },
};
