import type { Meta, StoryObj } from "@storybook/react-vite";
import { SendIcon } from "lucide-react";
import { Button } from "./button";

const meta = {
  title: "UI/Button",
  component: Button,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Button>;

export default meta;

export const Primary: StoryObj<typeof meta> = {
  args: { children: "Join the pool" },
};

export const Outline: StoryObj<typeof meta> = {
  args: { variant: "outline", children: "Read the policy" },
};

export const Ghost: StoryObj<typeof meta> = {
  args: { variant: "ghost", children: "Sign in" },
};

export const Link: StoryObj<typeof meta> = {
  args: { variant: "link", children: "What is a mutual?" },
};

export const Disabled: StoryObj<typeof meta> = {
  args: { children: "Pool closed", disabled: true },
};

export const WithIcon: StoryObj<typeof meta> = {
  args: { children: ["Claim", <SendIcon key="i" className="size-4" />] },
};
