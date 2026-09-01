import type { Meta, StoryObj } from "@storybook/react-vite";
import { StandardStory } from "./StandardStory";

const meta = {
  title: "Data Stories/StandardStory",
  component: StandardStory,
  parameters: { layout: "centered" },
} satisfies Meta<typeof StandardStory>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
