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

export const MediaAndMeta: StoryObj<typeof meta> = {
  args: {
    ...Default.args,
    text: "Mutuals are the oldest form of pooled protection on earth.",
    date: "Aug 25, 2026",
    // deterministic inline placeholder frame — no network fetch in Storybook
    media: {
      src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 90'%3E%3Crect width='160' height='90' fill='%23f4f1ec'/%3E%3Ctext x='80' y='50' text-anchor='middle' font-family='monospace' font-size='11' fill='%231a1a1a'%3E16:9 frame%3C/text%3E%3C/svg%3E",
      alt: "poster frame placeholder",
    },
    meta: "1,046 views · 13 likes",
  },
};
