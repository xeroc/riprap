import type { Meta, StoryObj } from "@storybook/react-vite";
import { SvgFrame } from "./SvgFrame";
import { TreasuryPayout, type TreasuryPayoutProps } from "./TreasuryPayout";

type TreasuryPayoutStoryProps = TreasuryPayoutProps;

const TreasuryPayoutStory = (args: TreasuryPayoutStoryProps) => (
  <SvgFrame
    width={480}
    height={360}
    title="Treasury payout"
    desc="The money leaves through the governed door: adjudication writes a swig policy; the member claims."
  >
    <TreasuryPayout {...args} />
  </SvgFrame>
);

const meta = {
  title: "Atoms/TreasuryPayout",
  component: TreasuryPayoutStory,
  parameters: { layout: "centered" },
} satisfies Meta<typeof TreasuryPayoutStory>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: {
    x: 104,
    y: 100,
    balance: 12000,
    maxBalance: 20000,
    amount: 2000,
    tierCap: 2000,
  },
};
