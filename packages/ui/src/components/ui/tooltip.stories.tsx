import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

const meta = {
  title: "UI/Tooltip",
  component: Tooltip,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Tooltip>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">juror draw</Button>
        </TooltipTrigger>
        <TooltipContent>N = 7 drawn jurors</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};
