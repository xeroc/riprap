import type { Meta, StoryObj } from "@storybook/react-vite";
import { JurorStone, type JurorStoneProps } from "./JurorStone";
import { SvgFrame } from "./SvgFrame";

type JurorStoneStoryProps = JurorStoneProps;

const JurorStoneStory = (args: JurorStoneStoryProps) => (
  <SvgFrame
    width={420}
    height={380}
    title="Juror stone"
    desc="A member stone that also signs up to judge — the ring is a state of the same stone."
  >
    <JurorStone {...args} />
  </SvgFrame>
);

const meta = {
  title: "Atoms/JurorStone",
  component: JurorStoneStory,
  parameters: { layout: "centered" },
} satisfies Meta<typeof JurorStoneStory>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: {
    x: 210,
    y: 170,
    size: "M",
    seed: 5,
    feeTag: "$20",
    stake: "$10",
    feeInflow: true,
  },
};
