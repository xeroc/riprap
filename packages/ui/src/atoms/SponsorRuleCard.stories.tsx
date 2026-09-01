import type { Meta, StoryObj } from "@storybook/react-vite";
import { SponsorRuleCard, type SponsorRuleCardProps } from "./SponsorRuleCard";
import { SvgFrame } from "./SvgFrame";

type SponsorRuleCardStoryProps = SponsorRuleCardProps;

const SponsorRuleCardStory = (args: SponsorRuleCardStoryProps) => (
  <SvgFrame
    width={560}
    height={260}
    title="Sponsor rule card"
    desc="The empty basin and the rule card that defines the mutual — nothing here yet but rules."
  >
    <SponsorRuleCard {...args} />
  </SvgFrame>
);

const meta = {
  title: "Atoms/SponsorRuleCard",
  component: SponsorRuleCardStory,
  parameters: { layout: "centered" },
} satisfies Meta<typeof SponsorRuleCardStory>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: {
    x: 40,
    y: 40,
    event: "{{EVENT}}",
    claimsWindow: "{{CLAIMS_WINDOW}}",
  },
};
