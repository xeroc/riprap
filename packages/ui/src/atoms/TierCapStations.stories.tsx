import type { Meta, StoryObj } from "@storybook/react-vite";
import { SvgFrame } from "./SvgFrame";
import { TierCapStations, type TierCapStationsProps } from "./TierCapStations";

type TierCapStationsStoryProps = TierCapStationsProps;

const TierCapStationsStory = (args: TierCapStationsStoryProps) => (
  <SvgFrame
    width={520}
    height={300}
    title="Tier cap stations"
    desc="The fee-to-cap relationship drawn honestly — hollow columns, dashed ceilings, the 1:100 ratio stated once as text."
  >
    <TierCapStations {...args} />
  </SvgFrame>
);

const meta = {
  title: "Atoms/TierCapStations",
  component: TierCapStationsStory,
  parameters: { layout: "centered" },
} satisfies Meta<typeof TierCapStationsStory>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: {
    x: 40,
    y: 40,
    highlight: "Standard",
    compact: false,
  },
};
