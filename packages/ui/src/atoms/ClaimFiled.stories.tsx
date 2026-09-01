import type { Meta, StoryObj } from "@storybook/react-vite";
import { ClaimFiled, type ClaimFiledProps } from "./ClaimFiled";
import { SvgFrame } from "./SvgFrame";

type ClaimFiledStoryProps = ClaimFiledProps;

const ClaimFiledStory = (args: ClaimFiledStoryProps) => (
  <SvgFrame
    width={420}
    height={300}
    title="Claim filed"
    desc="An incident inside the window, evidence attached, claim opened — one of the few places peril red is allowed."
  >
    <ClaimFiled {...args} />
  </SvgFrame>
);

const meta = {
  title: "Atoms/ClaimFiled",
  component: ClaimFiledStory,
  parameters: { layout: "centered" },
} satisfies Meta<typeof ClaimFiledStory>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: {
    x: 20,
    y: 20,
    width: 380,
    event: "{{EVENT}}",
    claimedAmount: 2000,
    tierCap: 2000,
    evidenceCount: 2,
    incidentAt: 0.45,
  },
};
