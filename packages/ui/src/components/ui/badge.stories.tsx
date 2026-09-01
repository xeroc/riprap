import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./badge";

const meta = {
  title: "UI/Badge",
  component: Badge,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Badge>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: { children: "juror staked" },
};

export const Strong: StoryObj<typeof meta> = {
  args: { variant: "strong", children: "pool open" },
};

export const Accent: StoryObj<typeof meta> = {
  args: { variant: "accent", children: "claims window" },
};

export const Destructive: StoryObj<typeof meta> = {
  args: { variant: "destructive", children: "rejected" },
};

export const Success: StoryObj<typeof meta> = {
  args: { variant: "success", children: "paid" },
};
