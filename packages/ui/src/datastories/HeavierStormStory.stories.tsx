import type { Meta, StoryObj } from "@storybook/react-vite";
import { HeavierStormStory } from "./HeavierStormStory";

const meta = {
  title: "Data Stories/HeavierStormStory",
  component: HeavierStormStory,
  parameters: { layout: "centered" },
} satisfies Meta<typeof HeavierStormStory>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
