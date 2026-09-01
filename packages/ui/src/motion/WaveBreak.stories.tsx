import type { Meta, StoryObj } from "@storybook/react-vite";
import { SvgFrame } from "../atoms/SvgFrame";
import { WaveBreak } from "./WaveBreak";

type WaveBreakStoryProps = Parameters<typeof WaveBreak>[0];

const WaveBreakStory = (args: WaveBreakStoryProps) => (
  <SvgFrame
    width={360}
    height={240}
    title="WaveBreak"
    desc="Motion wrapper over the static atom — honors prefers-reduced-motion by rendering the final state."
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

export const Default: StoryObj<typeof meta> = {
  args: {
    x: 80,
    y: 140,
  },
};
