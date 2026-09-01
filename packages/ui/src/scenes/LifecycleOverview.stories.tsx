import type { Meta, StoryObj } from "@storybook/react-vite";
import { LifecycleOverview } from "./LifecycleOverview";

const meta = {
  title: "Scenes/LifecycleOverview",
  component: LifecycleOverview,
  parameters: { layout: "centered" },
} satisfies Meta<typeof LifecycleOverview>;

export default meta;

export const WorkedExample: StoryObj<typeof meta> = {
  args: {
    poolBalance: 20000,
    afterClaims: 12000,
    maxBalance: 20000,
  },
};
