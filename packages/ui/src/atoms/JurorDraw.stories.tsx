import type { Meta, StoryObj } from "@storybook/react-vite";
import { JurorDraw, type JurorDrawProps } from "./JurorDraw";
import { SvgFrame } from "./SvgFrame";

type JurorDrawStoryProps = JurorDrawProps;

const JurorDrawStory = (args: JurorDrawStoryProps) => (
  <SvgFrame
    width={420}
    height={300}
    title="Juror draw"
    desc="N stones pulled at random from the staked pile, weighted by what they put in — VRF, on-chain."
  >
    <JurorDraw {...args} />
  </SvgFrame>
);

const meta = {
  title: "Atoms/JurorDraw",
  component: JurorDrawStory,
  parameters: { layout: "centered" },
} satisfies Meta<typeof JurorDrawStory>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: {
    x: 20,
    y: 20,
    jurorCount: 3,
  },
};
