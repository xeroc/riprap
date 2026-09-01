import type { Meta, StoryObj } from "@storybook/react-vite";
import { toast } from "sonner";
import { Button } from "./button";
import { Toaster } from "./sonner";

const meta = {
  title: "UI/Toaster",
  component: Toaster,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Toaster>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  render: () => (
    <div className="flex flex-col items-center gap-4">
      <Toaster position="bottom-right" />
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() =>
            toast.success("Claim filed", {
              description: "payout up to <span data-num>$2,000</span>",
            })
          }
        >
          success toast
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            toast("Pool closes in 3 days", {
              description: "entry window ends with the event",
            })
          }
        >
          info toast
        </Button>
      </div>
    </div>
  ),
};
