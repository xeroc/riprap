import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";

// jsdom has no resize observer / matchMedia in some paths — match landing tests
afterEach(() => {
  cleanup();
  window.history.pushState({}, "", "/");
  vi.restoreAllMocks();
});

function atPoolRoute() {
  window.history.pushState({}, "", "/2026-breakpoint-blade-pool");
  return render(<App />);
}

describe("/2026-breakpoint-blade-pool — the pool page", () => {
  it("routes by pathname: the pool page names the peril the landing must not", () => {
    atPoolRoute();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Get stabbed with friends.");
    // naming lock is a platform-page rule; the policy page states it plainly
    expect(document.body.textContent).toMatch(/knife assault/i);
  });

  it("the platform landing still renders at / (naming lock intact)", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Finance went P2P. Mutuals can too.",
    );
    expect(document.body.textContent).not.toMatch(/knife assault/i);
  });

  it("tier slider defaults to Standard ($20 / up to $2,000 — policy §5)", () => {
    atPoolRoute();
    expect(screen.getByText("Standard · $20 entry · up to $2,000 maximum payout")).toBeTruthy();
  });

  it("slider keyboard moves through exactly the three policy tiers", () => {
    atPoolRoute();
    const thumb = screen.getByRole("slider");
    fireEvent.keyDown(thumb, { key: "ArrowRight" });
    expect(screen.getByText("Premium · $40 entry · up to $4,000 maximum payout")).toBeTruthy();
    expect(screen.getByText("you've read the news")).toBeTruthy();
    fireEvent.keyDown(thumb, { key: "ArrowLeft" });
    fireEvent.keyDown(thumb, { key: "ArrowLeft" });
    expect(screen.getByText("Basic · $10 entry · up to $1,000 maximum payout")).toBeTruthy();
    expect(screen.getByText("you're probably fine")).toBeTruthy();
  });

  it("the odds table carries the four ludic rows, jokes never touching the math", () => {
    const { container } = atPoolRoute();
    const rows = [...container.querySelectorAll('[data-slot="odds"] tbody tr')].map(
      (tr) => tr.textContent,
    );
    expect(rows).toEqual([
      "You get stabbed at Breakpointstatistically negligible",
      "Accidental eye contact on the Tubecertain",
      "The pool dissolves on schedule100% — it's a program",
      "You send this page to the group chathigh",
    ]);
  });

  it("Chip in opens the waitlist dialog carrying the chosen tier", () => {
    atPoolRoute();
    fireEvent.click(screen.getByRole("button", { name: "Chip in $20" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog.textContent).toContain("Standard — $20 entry");
    expect(dialog.querySelectorAll("form[data-waitlist]").length).toBe(1);
  });

  it("fineprint: all 13 policy categories, all 8 exclusions, tier table from TIERS", () => {
    const { container } = atPoolRoute();
    const sections = [...container.querySelectorAll('[data-slot="policy-section"]')];
    expect(sections.length).toBe(13);
    const headings = sections.map((s) => s.querySelector("span.uppercase")?.textContent ?? "");
    expect(headings).toEqual([
      "Product",
      "Coverage period",
      "Covered event",
      "Exclusions",
      "Coverage tiers",
      "Pool",
      "Payout requests",
      "Pool dissolution",
      "Economic principle",
      "Worked example — Standard tier",
      "Product promise",
      "Legal status",
      "Counsel's recommendations",
    ]);
    // §4: exactly the eight exclusions from the policy
    const exclusions = container.querySelectorAll(
      '[data-slot="policy-section"] [data-slot="policy-exclusions"] li',
    );
    expect(exclusions.length).toBe(8);
    // §5: table bound to TIERS — all six prices present, mono, data-num
    const nums = [...container.querySelectorAll('[data-slot="policy-section"] td[data-num]')].map(
      (td) => td.textContent,
    );
    expect(nums).toEqual(["$10", "up to $1,000", "$20", "up to $2,000", "$40", "up to $4,000"]);
    // §7/§12: discretion and liability stated plainly — counsel recs 2 and 3
    expect(container.textContent).toContain("enforceable right to any payment");
    expect(container.textContent).toContain("no limited liability");
    // §13: the five counsel recommendations render
    const recs = container.querySelectorAll('[data-slot="policy-recommendations"] li');
    expect(recs.length).toBe(5);
  });
});
