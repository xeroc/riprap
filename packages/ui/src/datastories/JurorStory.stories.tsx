import type { Meta, StoryObj } from "@storybook/react-vite";
import { JurorStory } from "./JurorStory";

const meta = {
  title: "Data Stories/JurorStory",
  component: JurorStory,
  parameters: { layout: "centered" },
} satisfies Meta<typeof JurorStory>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
