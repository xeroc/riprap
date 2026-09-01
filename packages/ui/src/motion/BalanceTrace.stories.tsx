import type { Meta, StoryObj } from "@storybook/react-vite";
import { SvgFrame } from "../atoms/SvgFrame";
import { BalanceTrace } from "./BalanceTrace";

type BalanceTraceStoryProps = Parameters<typeof BalanceTrace>[0];

const BalanceTraceStory = (args: BalanceTraceStoryProps) => (
  <SvgFrame
    width={640}
    height={240}
    title="BalanceTrace"
    desc="Motion wrapper over the static atom — honors prefers-reduced-motion by rendering the final state."
  >
    <BalanceTrace {...args} />
  </SvgFrame>
);

const meta = {
  title: "Motion/BalanceTrace",
  component: BalanceTraceStory,
  parameters: { layout: "centered" },
} satisfies Meta<typeof BalanceTraceStory>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: {
    balances: [20000, 12000, 0],
    maxBalance: 20000,
    x: 40,
    width: 560,
    yBase: 180,
    yTop: 48,
  },
};
