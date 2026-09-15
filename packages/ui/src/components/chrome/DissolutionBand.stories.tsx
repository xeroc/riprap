import type { Meta, StoryObj } from "@storybook/react-vite";
import { DissolutionBand } from "./DissolutionBand";

const meta = {
  title: "Chrome/DissolutionBand",
  component: DissolutionBand,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof DissolutionBand>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: {
    remaining: 0,
    line: "Every claim paid. The crank returned the rest. The pool is closed.",
  },
};
