import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, describe, expect, it } from "vitest";
import { Button, buttonVariants } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
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
import { Separator } from "../ui/separator";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "../ui/sheet";
import { Toaster } from "../ui/sonner";
import { Textarea } from "../ui/textarea";

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

describe("Checkbox", () => {
  it("is a native input restyled: hairline-strong box, 2px radius, settle colors", () => {
    render(<Checkbox />);
    const el = screen.getByRole("checkbox");
    expect(el.className).toContain("appearance-none");
    expect(el.className).toContain("rounded-input");
    expect(el.className).toContain("border-hairline-strong");
    expect(el.className).toContain("bg-card");
    expect(el.className).toContain("checked:bg-stone");
  });

  it("toggles like a checkbox and shows the check glyph only when checked", () => {
    render(<Checkbox />);
    const el = screen.getByRole("checkbox") as HTMLInputElement;
    expect(el.checked).toBe(false);
    fireEvent.click(el);
    expect(el.checked).toBe(true);
    const box = el.parentElement;
    expect(box?.querySelector("svg")?.getAttribute("class")).toContain("peer-checked:block");
  });
});

describe("Textarea", () => {
  it("follows text-input law: card ground, hairline-strong edge, 2px radius", () => {
    render(<Textarea placeholder="what happened" />);
    const el = screen.getByPlaceholderText("what happened");
    expect(el.className).toContain("rounded-input");
    expect(el.className).toContain("border-hairline-strong");
    expect(el.className).toContain("bg-card");
    expect(el.className).toContain("min-h-24");
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
