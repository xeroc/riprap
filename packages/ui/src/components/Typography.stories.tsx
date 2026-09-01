import type { Meta, StoryObj } from "@storybook/react-vite";

/*
 * The full DESIGN.md type ramp on the dark ground — display-mega through
 * mono-label. Every numeral line renders in JetBrains Mono; grotesque stays
 * lowercase/sentence case (uppercase belongs to mono stamps only).
 */
const RAMP: { token: string; sample: string; note: string }[] = [
  { token: "display-mega", sample: "the pool holds", note: "homepage hero h1 — 64/1.05, −2.56px" },
  { token: "display-xl", sample: "two doors out", note: "subsidiary heroes — 48/1.08" },
  { token: "display-lg", sample: "how it works", note: "section heads — 36/1.15" },
  { token: "display-md", sample: "the jury draws", note: "sub-section heads — 32/1.2" },
  { token: "display-sm", sample: "card group titles", note: "24/1.25" },
  { token: "title-md", sample: "Component titles", note: "20/1.35 @ 500" },
  { token: "title-sm", sample: "List labels", note: "18/1.44 @ 500" },
  {
    token: "body-md",
    sample: "Fees pile in as stones; claims drain through two governed doors.",
    note: "default body — 16/1.55",
  },
  {
    token: "body-strong",
    sample: "Entry is a fee, not a premium.",
    note: "emphasized body — 16/1.55 @ 500",
  },
  { token: "body-sm", sample: "Event mutuals on Solana.", note: "footer body — 15/1.5" },
  {
    token: "mono-label",
    sample: ": BLADE POOL @ BREAKPOINT",
    note: "uppercase stamps — 12/1.4, +0.8px",
  },
  { token: "mono-number", sample: "$20,000", note: "numbers as hero — 20/1.2" },
  { token: "mono-number-lg", sample: "up to $2,000", note: "tier prices/caps — 32/1.1, −0.32px" },
  { token: "button", sample: "Join the pool", note: "CTA block — 15/1 @ 500" },
  { token: "nav-link", sample: "How it works", note: "top-nav menu — 14/1.4, +0.2px" },
];

const meta = {
  title: "Chrome/Typography",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;

export const Ramp: StoryObj<typeof meta> = {
  render: () => (
    <div className="flex flex-col gap-10 py-10">
      <p className="text-muted-foreground [font:var(--riprap-mono-label)] uppercase tracking-(--riprap-tracking-stamp)">
        type ramp — DESIGN.md § Typography
      </p>
      {RAMP.map(({ token, sample, note }) => (
        <div key={token} className="flex flex-col gap-2 border-b border-hairline pb-6">
          <p className="text-ink [font:var(--riprap-{token})]">{sample}</p>
          <p className="text-muted-soft [font:var(--riprap-mono-label)]">
            {token} — {note}
          </p>
        </div>
      ))}
    </div>
  ),
};
