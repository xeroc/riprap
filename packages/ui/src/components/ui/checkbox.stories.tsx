import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox } from "./checkbox";
import { Label } from "./label";

const meta = {
  title: "UI/Checkbox",
  component: Checkbox,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Checkbox>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: {},
};

export const Checked: StoryObj<typeof meta> = {
  args: { defaultChecked: true },
};

export const Disabled: StoryObj<typeof meta> = {
  args: { defaultChecked: true, disabled: true },
};

export const WithLabel: StoryObj<typeof meta> = {
  render: () => (
    <div className="flex w-96 items-start gap-3">
      <Checkbox id="screen" defaultChecked />
      <Label htmlFor="screen" className="normal-case tracking-normal">
        It caused bodily injury
      </Label>
    </div>
  ),
};
