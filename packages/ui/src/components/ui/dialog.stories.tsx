import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

const meta = {
  title: "UI/Dialog",
  component: Dialog,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Dialog>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Withdraw from the pool</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Withdraw stake</DialogTitle>
          <DialogDescription>
            Your stake of <span data-num>$10</span> returns to your wallet. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Withdraw</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
