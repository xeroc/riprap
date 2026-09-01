import type { Meta, StoryObj } from "@storybook/react-vite";
import { SvgFrame } from "../atoms/SvgFrame";
import { MarkAssemble } from "./MarkAssemble";

type MarkAssembleStoryProps = Parameters<typeof MarkAssemble>[0];

const MarkAssembleStory = (args: MarkAssembleStoryProps) => (
  <SvgFrame
    width={280}
    height={200}
    title="MarkAssemble"
    desc="The stone mark assembles — 7 grey stones drop-settle bottom-up, the harbor-blue crest lands last (40ms stagger). Settles on load; honors prefers-reduced-motion. Flip the mode toolbar to check the paper inversion."
  >
    <MarkAssemble {...args} />
  </SvgFrame>
);

const meta = {
  title: "Motion/MarkAssemble",
  component: MarkAssembleStory,
  parameters: { layout: "centered" },
} satisfies Meta<typeof MarkAssembleStory>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: { x: 140, y: 170 },
};

/** scale 0.5 ≈ the 64px corner/section anchor (DESIGN.md § Decorative Depth) */
export const FooterAnchor: StoryObj<typeof meta> = {
  args: { x: 140, y: 140, scale: 0.5 },
};
