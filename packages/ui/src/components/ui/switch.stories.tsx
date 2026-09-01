import type { Meta, StoryObj } from "@storybook/react-vite";
import { Switch } from "./switch";

const meta = {
  title: "UI/Switch",
  component: Switch,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Switch>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: { "aria-label": "juror opt-in" },
};

export const Checked: StoryObj<typeof meta> = {
  args: { checked: true, "aria-label": "juror opt-in" },
};

export const Small: StoryObj<typeof meta> = {
  args: { size: "sm", "aria-label": "compact" },
};
