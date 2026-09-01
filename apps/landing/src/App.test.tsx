import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "./App";

afterEach(cleanup);

describe("landing", () => {
  it("renders the approved hero headline as the single h1", () => {
    render(<App />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent).toBe("Any event. Any narrow peril. One finite pool.");
  });

  it("prices all three tiers exactly as the policy tier table", () => {
    render(<App />);
    for (const price of ["$10", "$20", "$40", "$1,000", "$2,000", "$4,000"]) {
      expect(screen.getAllByText(price).length).toBeGreaterThan(0);
    }
  });

  it("labels both governed doors on the pool vessel", () => {
    render(<App />);
    expect(screen.getAllByText("spending — adjudicated").length).toBeGreaterThan(0);
    expect(screen.getAllByText("liquidation").length).toBeGreaterThan(0);
  });

  it("asks the three FAQ teaser questions", () => {
    render(<App />);
    for (const q of [
      "Is this insurance?",
      "What if claims exceed the pool?",
      "Who are the jurors?",
    ]) {
      expect(screen.getByRole("heading", { name: q })).toBeTruthy();
    }
  });

  it("carries the open-parameters footnote", () => {
    render(<App />);
    expect(
      screen.getByText(
        /Still open: round-1 juror count N, round-1 juror fee size, claims-window length, join link/,
      ),
    ).toBeTruthy();
  });

  it("renders unresolved parameters as visible chips, not endpoints", () => {
    render(<App />);
    for (const param of ["{{MAILING_LIST}}", "{{CONTACT_EMAIL}}", "{{EXCLUSIONS}}"]) {
      expect(screen.getAllByText(param).length).toBeGreaterThan(0);
    }
  });

  it("links only to section anchors and the live X account — no fake endpoints", () => {
    const { container } = render(<App />);
    const hrefs = Array.from(container.querySelectorAll("a[href]"), (a) => a.getAttribute("href"));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(href?.startsWith("#") || href === "https://x.com/riprapxyz").toBe(true);
    }
    expect(container.textContent).not.toContain("mailto:");
  });
});
