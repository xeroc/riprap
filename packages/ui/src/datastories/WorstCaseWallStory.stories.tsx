import type { Meta, StoryObj } from "@storybook/react-vite";
import { WorstCaseWallStory } from "./WorstCaseWallStory";

const meta = {
  title: "Data Stories/WorstCaseWallStory",
  component: WorstCaseWallStory,
  parameters: { layout: "centered" },
} satisfies Meta<typeof WorstCaseWallStory>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
