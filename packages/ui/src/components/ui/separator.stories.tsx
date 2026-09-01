import type { Meta, StoryObj } from "@storybook/react-vite";
import { Separator } from "./separator";

const meta = {
  title: "UI/Separator",
  component: Separator,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Separator>;

export default meta;

export const Horizontal: StoryObj<typeof meta> = {
  render: () => <Separator className="w-64" />,
};

export const Vertical: StoryObj<typeof meta> = {
  render: () => (
    <div className="flex h-16 items-center">
      <Separator orientation="vertical" />
    </div>
  ),
};
