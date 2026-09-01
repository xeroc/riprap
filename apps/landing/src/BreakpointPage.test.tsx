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
  window.history.pushState({}, "", "/breakpoint-2026");
  return render(<App />);
}

describe("/breakpoint-2026 — the pool page", () => {
  it("routes by pathname: the pool page names the peril the landing must not", () => {
    atPoolRoute();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Knife-assault coverage for one conference.",
    );
    // naming lock is a platform-page rule; the policy page states it plainly
    expect(document.body.textContent).toMatch(/knife assault/i);
  });

  it("the platform landing still renders at / (naming lock intact)", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Any event. Any narrow peril. One finite pool.",
    );
    expect(document.body.textContent).not.toMatch(/knife assault/i);
  });

  it("hero links to the pool page via the first-pool stamp", () => {
    render(<App />);
    const link = screen.getByRole("link", { name: /Blade Pool at Breakpoint/i });
    expect(link.getAttribute("href")).toBe("/breakpoint-2026");
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
    fireEvent.keyDown(thumb, { key: "ArrowLeft" });
    fireEvent.keyDown(thumb, { key: "ArrowLeft" });
    expect(screen.getByText("Basic · $10 entry · up to $1,000 maximum payout")).toBeTruthy();
  });

  it("Participate opens the waitlist dialog carrying the chosen tier", () => {
    atPoolRoute();
    fireEvent.click(screen.getByRole("button", { name: "Participate" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog.textContent).toContain("Standard — $20 entry");
    expect(dialog.querySelectorAll("form[data-waitlist]").length).toBe(1);
  });

  it("fineprint: all 11 policy categories, all 8 exclusions, tier table from TIERS", () => {
    const { container } = atPoolRoute();
    const sections = [...container.querySelectorAll('[data-slot="policy-section"]')];
    expect(sections.length).toBe(11);
    const headings = sections.map((s) => s.querySelector("span.uppercase")?.textContent ?? "");
    expect(headings).toEqual([
      "Product",
      "Coverage period",
      "Covered event",
      "Exclusions",
      "Coverage tiers",
      "Pool",
      "Claims",
      "Pool dissolution",
      "Economic principle",
      "Worked example — Standard tier",
      "Product promise",
    ]);
    // §4: exactly the eight exclusions from the policy
    const exclusions = container.querySelectorAll('[data-slot="policy-section"] ul li');
    expect(exclusions.length).toBe(8);
    // §5: table bound to TIERS — all six prices present, mono, data-num
    const nums = [...container.querySelectorAll('[data-slot="policy-section"] td[data-num]')].map(
      (td) => td.textContent,
    );
    expect(nums).toEqual(["$10", "up to $1,000", "$20", "up to $2,000", "$40", "up to $4,000"]);
  });
});
