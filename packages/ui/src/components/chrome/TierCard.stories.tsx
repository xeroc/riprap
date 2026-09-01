import type { Meta, StoryObj } from "@storybook/react-vite";
import { TIERS } from "../../lib/poolMath";
import { TierCard, type TierCardProps } from "./TierCard";

// numbers from the policy tier table (policy §5) via lib/poolMath TIERS —
// the only allowed prices
const meta = {
  title: "Chrome/TierCard",
  component: TierCard,
  parameters: { layout: "centered" },
} satisfies Meta<typeof TierCard>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: {
    name: TIERS[1].name,
    fee: TIERS[1].fee,
    cap: TIERS[1].cap,
  } satisfies TierCardProps,
};
export const Grid: StoryObj<typeof meta> = {
  args: {
    name: TIERS[0].name,
    fee: TIERS[0].fee,
    cap: TIERS[0].cap,
  },
  render: () => (
    <div className="grid gap-6 md:grid-cols-3">
      {TIERS.map((tier) => (
        <TierCard
          key={tier.name}
          name={tier.name}
          fee={tier.fee}
          cap={tier.cap}
          footnote={
            tier.name === "Standard" ? "knife-assault cover for the whole event window" : undefined
          }
        />
      ))}
    </div>
  ),
};
