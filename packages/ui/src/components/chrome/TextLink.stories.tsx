import type { Meta, StoryObj } from "@storybook/react-vite";
import { TextLink } from "./TextLink";

const meta = {
  title: "Chrome/TextLink",
  component: TextLink,
  parameters: { layout: "centered" },
} satisfies Meta<typeof TextLink>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: {
    href: "#",
    children: "Read the policy",
  },
};

export const External: StoryObj<typeof meta> = {
  args: {
    href: "https://riprap.xyz",
    external: true,
    children: "Policy PDF",
  },
};
