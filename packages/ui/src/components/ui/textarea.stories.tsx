import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label } from "./label";
import { Textarea } from "./textarea";

const meta = {
  title: "UI/Textarea",
  component: Textarea,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Textarea>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: { placeholder: "what happened, in order" },
};

export const WithLabel: StoryObj<typeof meta> = {
  render: () => (
    <div className="flex w-96 flex-col gap-2">
      <Label htmlFor="narrative">what happened</Label>
      <Textarea id="narrative" rows={5} />
    </div>
  ),
};

export const Disabled: StoryObj<typeof meta> = {
  args: { placeholder: "window closed", disabled: true },
};

export const Invalid: StoryObj<typeof meta> = {
  args: { defaultValue: "…", "aria-invalid": true },
};
