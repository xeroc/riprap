import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label } from "./label";
import { Radio } from "./radio";

const meta = {
  title: "UI/Radio",
  component: Radio,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Radio>;

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
      <Radio id="answer" defaultChecked name="answer" value="unsure" />
      <Label htmlFor="answer" className="normal-case tracking-normal">
        Unsure
      </Label>
    </div>
  ),
};
