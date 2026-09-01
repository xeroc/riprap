import type { Meta, StoryObj } from "@storybook/react-vite";
import { SvgFrame } from "../atoms/SvgFrame";
import { PoolFill } from "./PoolFill";

type PoolFillStoryProps = Parameters<typeof PoolFill>[0];

const PoolFillStory = (args: PoolFillStoryProps) => (
  <SvgFrame
    width={560}
    height={360}
    title="PoolFill"
    desc="Motion wrapper over the static atom — the level rises with ease-out on the settle token and stops. Honors prefers-reduced-motion by rendering the final state."
  >
    <PoolFill {...args} />
  </SvgFrame>
);

const meta = {
  title: "Motion/PoolFill",
  component: PoolFillStory,
  parameters: { layout: "centered" },
} satisfies Meta<typeof PoolFillStory>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: {
    balance: 20000,
    maxBalance: 20000,
    x: 40,
    y: 40,
    surfaceStones: 3,
  },
};
