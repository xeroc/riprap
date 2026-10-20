import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Mechanism } from "./Mechanism";

// copy doc §2 flows (2026-10-20): the mechanism band is untabbed — the two
// flows render directly, three numbered glyph-stepped rows each; the pool
// steps' copy is folded into the descriptions.
describe("Mechanism — the flows band", () => {
  afterEach(cleanup);

  it("renders no tabs — the flows are the band", () => {
    render(<Mechanism />);
    expect(screen.queryByRole("tab")).toBeNull();
    expect(screen.queryByText("The pool")).toBeNull();
    expect(screen.queryByText("Joining")).toBeNull();
    expect(screen.queryByText("Claiming")).toBeNull();
    expect(screen.queryAllByRole("tablist").length).toBe(0);
  });

  it("both flows, three accent-numbered glyph-stepped rows each", () => {
    const { container } = render(<Mechanism />);
    expect(screen.getByText("Founding the group pool")).toBeTruthy();
    expect(screen.getByText("Drawing on group money")).toBeTruthy();
    // the flows' glyphs: sign, gather, return, filed, rule, claim
    const glyphs = [...container.querySelectorAll('[data-slot="flow-step"] [data-glyph]')].map(
      (g) => g.getAttribute("data-glyph"),
    );
    expect(glyphs).toEqual(["sign", "gather", "return", "filed", "rule", "claim"]);
    // each flow numbers its steps 01–03, mono accent
    const ordinals = [...container.querySelectorAll('[data-slot="flow-step"] [data-num]')].map(
      (n) => n.textContent,
    );
    expect(ordinals).toEqual(["01", "02", "03", "01", "02", "03"]);
    for (const n of container.querySelectorAll('[data-slot="flow-step"] [data-num]')) {
      expect(n.className).toContain("text-accent");
      expect(n.className).toContain("font-mono");
    }
  });

  it("carries the pool steps' folded copy and the Accord link", () => {
    render(<Mechanism />);
    // §2 steps folded in (copy doc §2 flows)
    expect(screen.getByText(/a program, not a company/)).toBeTruthy();
    expect(screen.getByText(/never more than the pool holds/)).toBeTruthy();
    expect(screen.getByText(/no admin key, no discretionary signer/)).toBeTruthy();
    expect(screen.getByText(/written at founding, before anything happens/)).toBeTruthy();
    const accord = screen.getByRole("link", { name: "Accord" });
    expect(accord.getAttribute("href")).toBe("https://useaccord.xyz");
  });

  it("no connector arrows remain between steps", () => {
    const { container } = render(<Mechanism />);
    expect(container.querySelectorAll('[data-slot="flow-connector"]').length).toBe(0);
    expect(container.querySelectorAll('[data-slot="glyph-tile"]').length).toBe(0);
  });
});
