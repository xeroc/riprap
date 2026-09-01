import type { Meta, StoryObj } from "@storybook/react-vite";
import { TopNav, type TopNavProps } from "./TopNav";

// link set per DESIGN.md § top-nav
const args: TopNavProps = {
  links: [
    { href: "#platform", label: "Platform" },
    { href: "#how-it-works", label: "How it works" },
    { href: "#blade-pool", label: "Blade Pool" },
    { href: "#faq", label: "FAQ" },
  ],
  signIn: { href: "#sign-in", label: "Sign In" },
  cta: { href: "#join", label: "Join the pool" },
};

const meta = {
  title: "Chrome/TopNav",
  component: TopNav,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TopNav>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args,
  render: (args) => (
    <div className="min-h-screen bg-ground">
      <TopNav {...args} />
    </div>
  ),
};

export const WithWordmark: StoryObj<typeof meta> = {
  args: {
    ...args,
    brand: (
      <span className="text-ink [font:var(--riprap-title-md)]">
        riprap<span className="text-(--riprap-accent)">.</span>
      </span>
    ),
  },
  render: Default.render,
};
