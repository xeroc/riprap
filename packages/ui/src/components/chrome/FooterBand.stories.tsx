import type { Meta, StoryObj } from "@storybook/react-vite";
import { FooterBand } from "./FooterBand";

const meta = {
  title: "Chrome/FooterBand",
  component: FooterBand,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof FooterBand>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: {
    columns: [
      {
        heading: "pool",
        links: [
          { href: "#how-it-works", label: "How it works" },
          { href: "#blade-pool", label: "Blade Pool" },
        ],
      },
      {
        heading: "jury",
        links: [
          { href: "#jurors", label: "Juror stake" },
          { href: "#appeals", label: "Appeals" },
        ],
      },
      {
        heading: "docs",
        links: [
          { href: "#policy", label: "Policy" },
          { href: "#program", label: "Pool program" },
        ],
      },
      {
        heading: "contact",
        links: [{ href: "mailto:pool@riprap.xyz", label: "pool@riprap.xyz" }],
      },
    ],
    brand: (
      <span className="text-ink [font:var(--riprap-title-md)]">
        riprap<span className="text-(--riprap-accent)">.</span>
      </span>
    ),
    tagline: "Event mutuals on Solana.",
  },
};
