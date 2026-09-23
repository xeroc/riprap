import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChatMessage, type ChatMessageProps } from "./ChatMessage";

const meta = {
  title: "Chrome/ChatMessage",
  component: ChatMessage,
  parameters: { layout: "centered" },
} satisfies Meta<typeof ChatMessage>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: {
    author: "Fabian Schuh",
    text: "Riprap is peer-to-peer cover on Solana — any group can start a pool, chip in, and drawn peers settle claims. riprap.xyz",
    meta: "forwarded message",
  } satisfies ChatMessageProps,
};
