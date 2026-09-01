import type { Meta, StoryObj } from "@storybook/react-vite";
import { SectionBand } from "./SectionBand";

const meta = {
  title: "Chrome/SectionBand",
  component: SectionBand,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SectionBand>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: {
    label: "how it works",
    children: (
      <p className="text-body [font:var(--riprap-body-md)]">
        Bands stack at 80px rhythm with a 1px stone rule between them.
      </p>
    ),
  },
};

export const Alternating: StoryObj<typeof meta> = {
  render: () => (
    <div className="bg-ground">
      <SectionBand label="one">First band on the ground.</SectionBand>
      <SectionBand label="two" tone="soft">
        Second band on the soft ground.
      </SectionBand>
      <SectionBand label="three">Third band, rule closes the page.</SectionBand>
    </div>
  ),
};
