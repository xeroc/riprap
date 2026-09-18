// The one navbar (copy doc §0): identical brand/links on every surface; the
// right side is the route's — the Open App CTA by default, the caller's
// controls (the app route's cluster select + wallet button) when passed.
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SiteNav } from "./SiteNav";

afterEach(cleanup);

describe("SiteNav", () => {
  it("renders the §0 links: How it works → the platform mechanism anchor, X (glyph) → the handle", () => {
    render(<SiteNav />);
    expect(screen.getByRole("link", { name: "How it works" }).getAttribute("href")).toBe(
      "#mechanism",
    );
    expect(screen.getByRole("link", { name: "X" }).getAttribute("href")).toBe(
      "https://x.com/riprapxyz",
    );
    expect(screen.getByText("launch: Breakpoint 2026")).toBeTruthy();
  });

  it("default right side is the Open App CTA → #/app", () => {
    render(<SiteNav />);
    expect(screen.getByRole("link", { name: "Open App" }).getAttribute("href")).toBe("#/app");
  });

  it("actions replace the CTA — the app route's controls take the slot", () => {
    render(<SiteNav actions={<button type="button">Connect wallet</button>} />);
    expect(screen.queryByRole("link", { name: "Open App" })).toBeNull();
    expect(screen.getByRole("button", { name: "Connect wallet" })).toBeTruthy();
  });
});
