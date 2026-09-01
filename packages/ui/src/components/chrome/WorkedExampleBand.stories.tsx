import type { Meta, StoryObj } from "@storybook/react-vite";
import { WorkedExampleBand } from "./WorkedExampleBand";

// figures per DESIGN.md § worked-example-band — pool math narrative;
// formatting via the numbers' own scale, values never invented here in prod
// code (landing passes worked-example figures from the source doc)
const meta = {
  title: "Chrome/WorkedExampleBand",
  component: WorkedExampleBand,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof WorkedExampleBand>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: {
    label: "worked example",
    figures: [
      { value: "1,000", caption: "members" },
      { value: "× $20", caption: "entry" },
      { value: "= $20,000", caption: "pool" },
      { value: "4 × $2,000", caption: "paid" },
      { value: "$12", caption: "back each" },
      { value: "dissolved", caption: "end state" },
    ],
  },
};
