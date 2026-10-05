import type { Meta, StoryObj } from "@storybook/react-vite";
import { PoolCard } from "./PoolCard";

// register words — platform register, numberless (AGENTS.md category law);
// groups are the landing §5 audience nouns, not real pools
const meta = {
  title: "Chrome/PoolCard",
  component: PoolCard,
  parameters: { layout: "centered" },
} satisfies Meta<typeof PoolCard>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: { name: "harbor fishing crew", risk: "lost haul", state: "open" },
};

export const Wall: StoryObj<typeof meta> = {
  args: { name: "harbor fishing crew", risk: "lost haul", state: "open" },
  render: () => (
    <div className="grid gap-6 md:grid-cols-3">
      <PoolCard name="harbor fishing crew" risk="lost haul" state="open" />
      <PoolCard name="climbing club" risk="gear damage" state="open" />
      <PoolCard name="valley farmers" risk="frost" state="founded" />
    </div>
  ),
};
