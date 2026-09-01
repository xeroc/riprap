import type { Meta, StoryObj } from "@storybook/react-vite";
import { CTABand } from "./CTABand";

const meta = {
  title: "Chrome/CTABand",
  component: CTABand,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof CTABand>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: {
    headline: "The pool opens when the event does.",
    cta: { href: "#join", label: "Join the pool" },
    footnote: "Entry closes with the event window. Dead on schedule.",
  },
};
