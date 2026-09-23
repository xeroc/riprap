import type { Meta, StoryObj } from "@storybook/react-vite";
import { EmailCard, type EmailCardProps } from "./EmailCard";

const meta = {
  title: "Chrome/EmailCard",
  component: EmailCard,
  parameters: { layout: "centered" },
} satisfies Meta<typeof EmailCard>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: {
    to: "[investor name]",
    subject: "Intro: Riprap — peer-to-peer cover on Solana",
    children: (
      <>
        {
          "Hi [name],\n\nI want to introduce you to Fabian, who is building Riprap — peer-to-peer cover on Solana.\n\nWorth 20 minutes?"
        }
      </>
    ),
  } satisfies EmailCardProps,
};
