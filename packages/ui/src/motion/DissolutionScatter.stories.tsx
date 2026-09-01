import type { Meta, StoryObj } from "@storybook/react-vite";
import { SvgFrame } from "../atoms/SvgFrame";
import { DissolutionScatter } from "./DissolutionScatter";

type DissolutionScatterStoryProps = Parameters<typeof DissolutionScatter>[0];

const DissolutionScatterStory = (args: DissolutionScatterStoryProps) => (
  <SvgFrame
    width={440}
    height={400}
    title="DissolutionScatter"
    desc="Motion wrapper over the static atom — honors prefers-reduced-motion by rendering the final state."
  >
    <DissolutionScatter {...args} />
  </SvgFrame>
);

const meta = {
  title: "Motion/DissolutionScatter",
  component: DissolutionScatterStory,
  parameters: { layout: "centered" },
} satisfies Meta<typeof DissolutionScatterStory>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: {
    x: 150,
    y: 80,
  },
};
