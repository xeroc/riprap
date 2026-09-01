import type { Meta, StoryObj } from "@storybook/react-vite";
import { LogoLockup } from "./LogoLockup";
import { Logomark } from "./Logomark";
import { Wordmark } from "./Wordmark";

const meta: Meta<typeof Logomark> = {
  title: "Brand/Logomark",
  component: Logomark,
  parameters: { layout: "centered" },
};
export default meta;

type Mark = StoryObj<typeof Logomark>;

export const Settled: Mark = { args: { size: 96, state: "settled" } };
export const Assembling: Mark = {
  args: { size: 96, state: "assemble" },
  parameters: {
    docs: {
      description: {
        story:
          "Stones settle clockwise from 12; the harbor-blue newest member arrives last (40ms stagger).",
      },
    },
  },
};
export const Dissolving: Mark = { args: { size: 96, state: "dissolve" } };
export const FaviconScale: Mark = { args: { size: 16, state: "settled" } };
export const AnchorScale: Mark = { args: { size: 40, state: "settled" } };

export const WordmarkStory: StoryObj<typeof Wordmark> = {
  render: () => (
    <div style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
      <Wordmark size={64} />
      <Wordmark size={28} />
      <Wordmark size={16} />
    </div>
  ),
  name: "Wordmark",
};

export const Lockups: StoryObj<typeof LogoLockup> = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, alignItems: "flex-start" }}>
      <LogoLockup size={28} />
      <LogoLockup size={20} />
      <LogoLockup size={28} wordmark={false} />
      <LogoLockup size={28} markState="assemble" />
    </div>
  ),
  name: "Lockups",
};
