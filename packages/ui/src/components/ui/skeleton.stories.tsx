import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton } from "./skeleton";

const meta = {
  title: "UI/Skeleton",
  component: Skeleton,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Skeleton>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  args: { className: "h-11 w-72" },
};

export const Card: StoryObj<typeof meta> = {
  render: () => (
    <div className="flex w-72 flex-col gap-3 border border-hairline bg-card p-6">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-px w-full" />
    </div>
  ),
};
