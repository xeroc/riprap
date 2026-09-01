import type { Meta, StoryObj } from "@storybook/react-vite";
import { BadgeStamp } from "./BadgeStamp";

const meta = {
  title: "Chrome/BadgeStamp",
  component: BadgeStamp,
  parameters: { layout: "centered" },
} satisfies Meta<typeof BadgeStamp>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: {
    children: "juror pool",
  },
};
