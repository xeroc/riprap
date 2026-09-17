import type { Meta, StoryObj } from "@storybook/react-vite";
import { TweetCard } from "./TweetCard";

// quotes verbatim from x.com — evidence chrome carries real posts in prod,
// never invented ones
const meta = {
  title: "Chrome/TweetCard",
  component: TweetCard,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TweetCard>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: {
    author: "bunjil",
    handle: "bunjil",
    text: "at london breakpoint 😃🤙\n\ngetting stabbed 😱🔪\n\nat 1 billion TPS 🤯🚀",
    date: "Dec 12, 2025",
    className: "w-80",
  },
};

export const Linked: StoryObj<typeof meta> = {
  args: {
    ...Default.args,
    href: "https://x.com/bunjil/status/1999412271404187937",
  },
};

export const Truncated: StoryObj<typeof meta> = {
  args: {
    ...Default.args,
    text: "“London is too dangerous for Breakpoint, you’ll get stabbed” 😭\n\nMy brother in Christ, London has 220k+ millionaires whose net worth isn’t tied to staying alive",
    maxChars: 90,
  },
};
