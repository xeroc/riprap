import type { Meta, StoryObj } from "@storybook/react-vite";
import { WorkedExampleReceipt } from "./WorkedExampleReceipt";

// figures per DESIGN.md § worked-example-receipt — pool math narrative;
// formatting via the numbers' own scale, values never invented here in prod
// code (landing passes worked-example figures from the source doc)
const meta = {
  title: "Chrome/WorkedExampleReceipt",
  component: WorkedExampleReceipt,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof WorkedExampleReceipt>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: {
    label: "worked example",
    lines: [
      { value: "1,000", caption: "members" },
      { value: "× $20", caption: "entry" },
      { value: "= $20,000", caption: "pool" },
      { value: "4 × $2,000", caption: "paid" },
    ],
    total: { value: "$12", caption: "back each" },
  },
};

export const NoTotal: StoryObj<typeof meta> = {
  args: {
    ...Default.args,
    total: undefined,
  },
};
