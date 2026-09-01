import type { Meta, StoryObj } from "@storybook/react-vite";
import { Dissolution, type DissolutionProps } from "./Dissolution";
import { SvgFrame } from "./SvgFrame";

type DissolutionStoryProps = DissolutionProps;

const DissolutionStory = (args: DissolutionStoryProps) => (
  <SvgFrame
    width={440}
    height={400}
    title="Dissolution"
    desc="The pile disperses, the vessel empties, nothing survives — dash is the visual past tense."
  >
    <Dissolution {...args} />
  </SvgFrame>
);

const meta = {
  title: "Atoms/Dissolution",
  component: DissolutionStory,
  parameters: { layout: "centered" },
} satisfies Meta<typeof DissolutionStory>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: {
    x: 150,
    y: 80,
    stoneCount: 6,
  },
};
