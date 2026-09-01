import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemberStone, type MemberStoneProps } from "./MemberStone";
import { SvgFrame } from "./SvgFrame";

type MemberStoneStoryProps = MemberStoneProps;

const MemberStoneStory = (args: MemberStoneStoryProps) => (
  <SvgFrame
    width={240}
    height={220}
    title="Member stone"
    desc="One stone lands in the pile — 1 stone = 1 member; tier = size class; fee = the printed number."
  >
    <MemberStone {...args} />
  </SvgFrame>
);

const meta = {
  title: "Atoms/MemberStone",
  component: MemberStoneStory,
  parameters: { layout: "centered" },
} satisfies Meta<typeof MemberStoneStory>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: {
    size: "M",
    seed: 1,
    x: 120,
    y: 110,
    feeTag: "$20",
    rightsTick: true,
  },
};
