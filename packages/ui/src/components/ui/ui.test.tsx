import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, describe, expect, it } from "vitest";
import { Avatar, AvatarFallback, AvatarGroup } from "../ui/avatar";
import { Badge, badgeVariants } from "../ui/badge";
import { Button, buttonVariants } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Separator } from "../ui/separator";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "../ui/sheet";
import { Skeleton } from "../ui/skeleton";
import { Toaster } from "../ui/sonner";
import { Switch } from "../ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

afterEach(cleanup);

describe("Button — DESIGN.md § Buttons", () => {
  it("defaults to the primary variant: warm-white block, 40px, button type token", () => {
    render(<Button>Join the pool</Button>);
    const el = screen.getByRole("button", { name: "Join the pool" });
    expect(el.getAttribute("data-variant")).toBe("primary");
    expect(el.className).toContain("bg-primary");
    expect(el.className).toContain("text-on-primary");
    expect(el.className).toContain("h-10");
    expect(el.className).toContain("[font:var(--riprap-button-type)]");
    expect(el.className).toContain("rounded-none");
  });

  it("maps every variant per DESIGN.md (no opacity fades, press = 1px drop)", () => {
    const primary = buttonVariants({ variant: "primary" });
    expect(primary).toContain("hover:bg-primary-active");
    expect(primary).toContain("active:translate-y-px");
    expect(primary).not.toContain("opacity-");

    const outline = buttonVariants({ variant: "outline" });
    expect(outline).toContain("border-hairline-strong");
    expect(outline).toContain("hover:border-stone");
    expect(outline).not.toContain("hover:bg-");

    const link = buttonVariants({ variant: "link" });
    expect(link).toContain("text-(--riprap-accent)");
    expect(link).toContain("hover:text-(--riprap-accent-hover)");
    // accent is never a fill — no background utility beyond bg-clip/transparent
    expect(link).not.toMatch(/(?:^|\s)bg-(?!clip|transparent)/);
  });

  it("disabled = muted-soft, never a fade", () => {
    expect(buttonVariants({ variant: "primary" })).toContain("disabled:text-muted-soft");
  });

  it("focus ring is stone (the --color-ring mapping)", () => {
    expect(buttonVariants({ variant: "primary" })).toMatch(
      /focus-visible:ring-3 focus-visible:ring-ring/,
    );
  });
});

describe("Badge — stamps, never pills", () => {
  it("renders the stamp anatomy: transparent, stone text, hairline, radius 0, mono", () => {
    render(<Badge>juror staked</Badge>);
    const el = screen.getByText("juror staked");
    expect(el.className).toContain("rounded-none");
    expect(el.className).toContain("border-hairline");
    expect(el.className).toContain("text-stone");
    expect(el.className).toContain("[font:var(--riprap-mono-label)]");
    expect(el.className).toContain("uppercase");
    expect(el.className).not.toMatch(/(?:^|\s)bg-(?!transparent)/); // transparent is the stamp ground
  });

  it("keeps variant mapping explicit", () => {
    expect(badgeVariants({ variant: "destructive" })).toContain("text-error");
    expect(badgeVariants({ variant: "strong" })).toContain("border-hairline-strong");
  });
});

describe("Input", () => {
  it("follows text-input law: card ground, hairline-strong edge, 2px radius, 44px", () => {
    render(<Input placeholder="wallet" />);
    const el = screen.getByPlaceholderText("wallet");
    expect(el.className).toContain("rounded-input");
    expect(el.className).toContain("border-hairline-strong");
    expect(el.className).toContain("bg-card");
    expect(el.className).toContain("h-11");
  });

  it("focus thickens the edge to 2px stone via outline — no layout shift", () => {
    render(<Input />);
    expect(screen.getByRole("textbox").className).toContain(
      "focus-visible:outline-2 focus-visible:outline-stone",
    );
  });
});

describe("Label", () => {
  it("is an uppercase mono section label", () => {
    render(<Label>entry fee</Label>);
    const el = screen.getByText("entry fee");
    expect(el.className).toContain("[font:var(--riprap-mono-label)]");
    expect(el.className).toContain("uppercase");
  });
});

describe("Separator", () => {
  it("renders a 1px hairline rule", () => {
    const { container } = render(<Separator />);
    const el = container.querySelector('[data-slot="separator"]');
    expect(el).toBeTruthy();
    expect(el?.className).toContain("bg-border"); // --color-border = hairline
    expect(el?.className).toContain("h-px");
  });
});

describe("Skeleton", () => {
  it("is a static tone block — no oscillating pulse loop", () => {
    const { container } = render(<Skeleton />);
    const el = container.querySelector('[data-slot="skeleton"]');
    expect(el?.className).toContain("bg-strong");
    expect(el?.className).toContain("rounded-none");
    expect(el?.className).not.toContain("animate-");
  });
});

describe("Avatar", () => {
  it("keeps the disc — the only circle — and renders the mono fallback", () => {
    render(
      <Avatar>
        <AvatarFallback>JP</AvatarFallback>
      </Avatar>,
    );
    const el = screen.getByText("JP");
    expect(el.className).toContain("[font:var(--riprap-mono-label)]");
    // the disc lives on the root (overflow-hidden clips the image to it)
    expect(el.closest('[data-slot="avatar"]')?.className).toContain("rounded-full");
  });

  it("groups overlap without shadows", () => {
    const { container } = render(
      <AvatarGroup>
        <Avatar>
          <AvatarFallback>J1</AvatarFallback>
        </Avatar>
      </AvatarGroup>,
    );
    const group = container.querySelector('[data-slot="avatar-group"]');
    expect(group?.className).not.toMatch(/shadow-/);
  });
});

describe("Tooltip", () => {
  it("renders mono content on a strong plate with hairline-strong edge", () => {
    render(
      <TooltipProvider>
        <Tooltip defaultOpen>
          <TooltipTrigger>tier cap</TooltipTrigger>
          <TooltipContent forceMount>
            up to <span data-num>$2,000</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    const content = screen.getByText("up to");
    expect(content.className).toContain("rounded-none");
    expect(content.className).toContain("border-hairline-strong");
    expect(content.className).toContain("bg-strong");
    expect(content.className).toContain("[font:var(--riprap-mono-label)]");
  });
});

describe("Tabs", () => {
  it("ruled list + mono uppercase triggers + stone underline on active", () => {
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">mechanism</TabsTrigger>
          <TabsTrigger value="b">jury</TabsTrigger>
        </TabsList>
        <TabsContent value="a">two doors</TabsContent>
      </Tabs>,
    );
    const list = screen.getByRole("tablist");
    expect(list.className).toContain("border-hairline");
    const trigger = screen.getByRole("tab", { selected: true });
    expect(trigger.className).toContain("[font:var(--riprap-mono-label)]");
    expect(trigger.className).toContain("uppercase");
    expect(trigger.className).toContain("after:bg-stone");
  });
});

describe("Switch", () => {
  it("is rectangular chrome — no circle, square thumb", () => {
    const { container } = render(<Switch aria-label="juror opt-in" />);
    const track = container.querySelector('[data-slot="switch"]');
    const thumb = container.querySelector('[data-slot="switch-thumb"]');
    expect(track?.className).toContain("rounded-none");
    expect(thumb?.className).toContain("rounded-none");
    expect(track?.className).not.toContain("rounded-full");
  });

  it("checked = the warm-white primary block", () => {
    const { container } = render(<Switch checked aria-label="x" />);
    const track = container.querySelector('[data-slot="switch"]');
    expect(track?.className).toContain("data-checked:bg-primary");
    expect(track?.getAttribute("data-state")).toBe("checked");
  });
});

describe("Select", () => {
  it("trigger follows the text-input law", () => {
    render(
      <Select>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="tier" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="standard">Standard</SelectItem>
        </SelectContent>
      </Select>,
    );
    const trigger = screen.getByRole("combobox");
    expect(trigger.className).toContain("rounded-input");
    expect(trigger.className).toContain("border-hairline-strong");
    expect(trigger.className).toContain("h-11");
  });
});

describe("Dialog", () => {
  it("opens a ruled plate: hairline border, radius 0, no shadow, no blur", () => {
    render(
      <Dialog>
        <DialogTrigger>open</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw stake</DialogTitle>
            <DialogDescription>stake of $10 returns</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );
    fireEvent.click(screen.getByText("open"));
    const dialog = screen.getByRole("dialog");
    expect(dialog.className).toContain("rounded-none");
    expect(dialog.className).toContain("border-hairline");
    expect(dialog.className).not.toMatch(/shadow-|backdrop-blur/);
    expect(screen.getByRole("dialog").textContent).toContain("Withdraw stake");
  });
});

describe("Sheet", () => {
  it("opens docked right with a hairline inner edge", () => {
    render(
      <Sheet>
        <SheetTrigger>menu</SheetTrigger>
        <SheetContent>
          <SheetTitle>Menu</SheetTitle>
        </SheetContent>
      </Sheet>,
    );
    fireEvent.click(screen.getByText("menu"));
    const panel = screen.getByRole("dialog");
    expect(panel.getAttribute("data-side")).toBe("right");
    expect(panel.className).toContain("border-l");
    expect(panel.className).not.toMatch(/shadow-/);
  });
});

describe("DropdownMenu", () => {
  it("opens a ruled list with a hairline border and no shadow", () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Claim</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const trigger = screen.getByText("actions");
    fireEvent.pointerDown(trigger);
    fireEvent.click(trigger);
    const menu = screen.getByRole("menu");
    expect(menu.className).toContain("rounded-none");
    expect(menu.className).toContain("border-hairline");
    expect(menu.className).not.toMatch(/shadow-/);
    expect(screen.getByRole("menuitem", { name: "Claim" })).toBeTruthy();
  });
});

describe("Popover", () => {
  it("opens a ruled plate", () => {
    render(
      <Popover>
        <PopoverTrigger>how the cap works</PopoverTrigger>
        <PopoverContent>up to $2,000</PopoverContent>
      </Popover>,
    );
    fireEvent.click(screen.getByText("how the cap works"));
    const region = screen.getByRole("dialog");
    expect(region.className).toContain("rounded-none");
    expect(region.className).toContain("border-hairline");
  });
});
describe("Toaster (sonner)", () => {
  it("mounts themed to the ground: card plate, hairline-strong edge, radius 0", async () => {
    const { baseElement } = render(<Toaster position="bottom-right" />);
    // sonner mounts its viewport on the first toast
    toast("pool opens", { description: "<span data-num>$20</span> entry" });
    await waitFor(() => {
      expect(baseElement.querySelector("[data-sonner-toaster]")).toBeTruthy();
    });
    const toaster = baseElement.querySelector(".toaster") as HTMLElement;
    expect(toaster.style.getPropertyValue("--normal-bg")).toBe("var(--riprap-surface-card)");
    expect(toaster.style.getPropertyValue("--normal-border")).toBe("var(--riprap-hairline-strong)");
    expect(toaster.style.getPropertyValue("--border-radius")).toBe("0px");
  });
});
