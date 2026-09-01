import type { Meta, StoryObj } from "@storybook/react-vite";
import { PoolVessel, type PoolVesselProps } from "./PoolVessel";
import { SvgFrame } from "./SvgFrame";

type PoolVesselStoryProps = PoolVesselProps;

const PoolVesselStory = (args: PoolVesselStoryProps) => (
  <SvgFrame
    width={560}
    height={360}
    title="Pool vessel"
    desc="The vessel and its fill — fill area is proportional to the treasury balance; two governed doors, never a third exit."
  >
    <PoolVessel {...args} />
  </SvgFrame>
);

const meta = {
  title: "Atoms/PoolVessel",
  component: PoolVesselStory,
  parameters: { layout: "centered" },
} satisfies Meta<typeof PoolVesselStory>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: {
    balance: 20000,
    maxBalance: 20000,
    x: 40,
    y: 40,
    spendingDoor: "shut",
    liquidationDoor: "shut",
    surfaceStones: 3,
  },
};
