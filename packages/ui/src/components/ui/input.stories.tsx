import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "./input";
import { Label } from "./label";

const meta = {
  title: "UI/Input",
  component: Input,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Input>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: { placeholder: "wallet address" },
};

export const WithLabel: StoryObj<typeof meta> = {
  render: () => (
    <div className="flex w-72 flex-col gap-2">
      <Label htmlFor="stake">juror stake</Label>
      <Input id="stake" defaultValue="$10" data-num />
    </div>
  ),
};

export const Disabled: StoryObj<typeof meta> = {
  args: { placeholder: "pool closed", disabled: true },
};

export const Invalid: StoryObj<typeof meta> = {
  args: { defaultValue: "not an address", "aria-invalid": true },
};
