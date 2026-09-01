import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "./popover";

const meta = {
  title: "UI/Popover",
  component: Popover,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Popover>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">How the cap works</Button>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Payout ceiling</PopoverTitle>
          <PopoverDescription>
            Your tier caps every payout — the pool never owes more than it holds.
          </PopoverDescription>
        </PopoverHeader>
        <p data-num className="font-mono text-sm text-ink">
          up to $2,000
        </p>
      </PopoverContent>
    </Popover>
  ),
};
