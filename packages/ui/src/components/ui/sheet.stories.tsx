import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";

const meta = {
  title: "UI/Sheet",
  component: Sheet,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Sheet>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open drawer</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>Navigation drawer, docked right.</SheetDescription>
        </SheetHeader>
        <nav className="flex flex-col gap-3 px-4 [font:var(--riprap-mono-label)] text-muted-foreground uppercase">
          <a href="#platform">Platform</a>
          <a href="#how-it-works">How it works</a>
          <a href="#blade-pool">Blade Pool</a>
        </nav>
      </SheetContent>
    </Sheet>
  ),
};
