import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProRataRefund, type ProRataRefundProps } from "./ProRataRefund";
import { SvgFrame } from "./SvgFrame";

type ProRataRefundStoryProps = ProRataRefundProps;

const ProRataRefundStory = (args: ProRataRefundStoryProps) => (
  <SvgFrame
    width={520}
    height={440}
    title="Pro rata refund"
    desc="The money that was never needed goes home — sliced remainder, permissionless crank, the formula printed."
  >
    <ProRataRefund {...args} />
  </SvgFrame>
);

const meta = {
  title: "Atoms/ProRataRefund",
  component: ProRataRefundStory,
  parameters: { layout: "centered" },
} satisfies Meta<typeof ProRataRefundStory>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: {
    x: 150,
    y: 40,
    remainder: 12000,
    maxBalance: 20000,
    memberCount: 1000,
    perMember: 12,
  },
};
