import type { Meta, StoryObj } from "@storybook/react-vite";
import { JoinFlow } from "./JoinFlow";

const meta = {
  title: "Scenes/JoinFlow",
  component: JoinFlow,
  parameters: { layout: "centered" },
} satisfies Meta<typeof JoinFlow>;

export default meta;

export const WorkedExample: StoryObj<typeof meta> = {
  args: {
    members: 1000,
    fee: 20,
    balance: 20000,
    maxBalance: 20000,
    event: "{{EVENT}}",
  },
};

export const PoolOne: StoryObj<typeof meta> = {
  args: {
    ...WorkedExample.args,
    event: "Breakpoint 2026",
  },
};
