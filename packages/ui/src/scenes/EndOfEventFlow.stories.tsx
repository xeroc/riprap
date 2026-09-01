import type { Meta, StoryObj } from "@storybook/react-vite";
import { EndOfEventFlow } from "./EndOfEventFlow";

const meta = {
  title: "Scenes/EndOfEventFlow",
  component: EndOfEventFlow,
  parameters: { layout: "centered" },
} satisfies Meta<typeof EndOfEventFlow>;

export default meta;

export const WorkedExample: StoryObj<typeof meta> = {
  args: {
    remainder: 12000,
    maxBalance: 20000,
    members: 1000,
    perMember: 12,
  },
};

export const HeavierStormRemainder: StoryObj<typeof meta> = {
  args: {
    remainder: 8000,
    maxBalance: 20000,
    members: 1000,
    perMember: 8,
  },
};
