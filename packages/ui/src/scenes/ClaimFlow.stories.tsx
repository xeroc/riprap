import type { Meta, StoryObj } from "@storybook/react-vite";
import { ClaimFlow } from "./ClaimFlow";

const meta = {
  title: "Scenes/ClaimFlow",
  component: ClaimFlow,
  parameters: { layout: "centered", backgrounds: { default: "light" } },
} satisfies Meta<typeof ClaimFlow>;

export default meta;

export const WorkedExample: StoryObj<typeof meta> = {
  args: {
    claimedAmount: 2000,
    tierCap: 2000,
    evidenceCount: 2,
    jurorCount: 3,
    outcome: "pay",
    tally: [2, 1],
    payoutAmount: 2000,
    balance: 12000,
    maxBalance: 20000,
  },
};

export const Rejected: StoryObj<typeof meta> = {
  args: {
    ...WorkedExample.args,
    outcome: "reject",
    tally: [1, 2],
  },
};
