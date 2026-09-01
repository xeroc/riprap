import type { Meta, StoryObj } from "@storybook/react-vite";
import { TierLadderStory } from "./TierLadderStory";

const meta = {
  title: "Data Stories/TierLadderStory",
  component: TierLadderStory,
  parameters: { layout: "centered" },
} satisfies Meta<typeof TierLadderStory>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
