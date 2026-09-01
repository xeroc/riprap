import type { Meta, StoryObj } from "@storybook/react-vite";
import { StampBadge, type StampBadgeProps } from "./StampBadge";

const meta = {
  title: "Chrome/StampBadge",
  component: StampBadge,
  parameters: { layout: "centered" },
} satisfies Meta<typeof StampBadge>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: {
    pool: "Blade Pool",
    event: "Breakpoint",
  } satisfies StampBadgeProps,
};
