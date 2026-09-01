import type { Meta, StoryObj } from "@storybook/react-vite";
import { Ruling, type RulingProps } from "./Ruling";
import { SvgFrame } from "./SvgFrame";

type RulingStoryProps = RulingProps;

const RulingStory = (args: RulingStoryProps) => (
  <SvgFrame
    width={420}
    height={300}
    title="Ruling"
    desc="Revealed votes collapse into one outcome; the appeal ladder doubles the jury."
  >
    <Ruling {...args} />
  </SvgFrame>
);

const meta = {
  title: "Atoms/Ruling",
  component: RulingStory,
  parameters: { layout: "centered" },
} satisfies Meta<typeof RulingStory>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: {
    x: 20,
    y: 20,
    outcome: "pay",
    tally: [2, 1],
    appealRound: 0,
  },
};
