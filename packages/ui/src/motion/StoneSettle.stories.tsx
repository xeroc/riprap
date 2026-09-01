import type { Meta, StoryObj } from "@storybook/react-vite";
import { SvgFrame } from "../atoms/SvgFrame";
import { StoneSettle } from "./StoneSettle";

type StoneSettleStoryProps = Parameters<typeof StoneSettle>[0];

const StoneSettleStory = (args: StoneSettleStoryProps) => (
  <SvgFrame
    width={240}
    height={220}
    title="StoneSettle"
    desc="Motion wrapper over the static atom — honors prefers-reduced-motion by rendering the final state."
  >
    <StoneSettle {...args} />
  </SvgFrame>
);

const meta = {
  title: "Motion/StoneSettle",
  component: StoneSettleStory,
  parameters: { layout: "centered" },
} satisfies Meta<typeof StoneSettleStory>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: {
    size: "M",
    seed: 1,
    x: 120,
    y: 130,
    feeTag: "$20",
    delay: 0,
  },
};
