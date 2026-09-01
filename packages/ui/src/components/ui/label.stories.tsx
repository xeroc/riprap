import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label } from "./label";

const meta = {
  title: "UI/Label",
  component: Label,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Label>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: { children: "entry fee", htmlFor: "fee" },
};
