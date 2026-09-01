import type { Meta, StoryObj } from "@storybook/react-vite";
import { FeatureCard } from "./FeatureCard";

const meta = {
  title: "Chrome/FeatureCard",
  component: FeatureCard,
  parameters: { layout: "centered" },
} satisfies Meta<typeof FeatureCard>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: {
    title: "Two doors, never three",
    children:
      "Money leaves the pool through spending the jury approved, or through liquidation back to members. There is no third exit.",
  },
};
export const Grid: StoryObj<typeof meta> = {
  args: {
    title: "Members pile in",
    children: "Entry is a fee, not a premium. Each member is one stone in the pile.",
  },
  render: () => (
    <div className="grid gap-6 md:grid-cols-3">
      <FeatureCard title="Members pile in">
        Entry is a fee, not a premium. Each member is one stone in the pile.
      </FeatureCard>
      <FeatureCard title="A jury of peers">
        Claims are read by randomly drawn, stake-weighted jurors from this pool.
      </FeatureCard>
      <FeatureCard title="Dead on schedule">
        The event ends, the crank returns the remainder, the pool dereferences.
      </FeatureCard>
    </div>
  ),
};
