import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Mechanism } from "./Mechanism";

// copy doc §2 (2026-10-21 founder + UX pass): the mechanism band is a
// card-and-pane tab pattern — three lane cards (the tab list: founding,
// joining, drawing, each with its actor) in the left half; hover, focus,
// or tap reveals the lane's three glyph-stepped rows in the pane. The
// old five-step list and the 2026-10-20 side-by-side flows are folded in.
describe("Mechanism — the lane cards band", () => {
  afterEach(cleanup);

  it("three lane cards, one pane — tabs semantics", () => {
    render(<Mechanism />);
    expect(screen.getByText("Three acts. One pool.")).toBeTruthy();
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual([
      "Founding the poolthe founder",
      "Joining the poolthe member",
      "Drawing on the poolthe requester",
    ]);
    expect(screen.getAllByRole("tablist").length).toBe(1);
    expect(screen.getAllByRole("tabpanel").length).toBeGreaterThanOrEqual(1);
  });

  it("the founding lane is active on load — its three steps in the pane", () => {
    const { container } = render(<Mechanism />);
    const glyphs = [...container.querySelectorAll('[data-slot="flow-step"] [data-glyph]')].map(
      (g) => g.getAttribute("data-glyph"),
    );
    expect(glyphs).toEqual(["sign", "filed", "gather"]);
    expect(screen.getByText("One transaction")).toBeTruthy();
    expect(screen.getByText("Pin the terms")).toBeTruthy();
    expect(screen.getByText(/written at founding, before anything happens/)).toBeTruthy();
    expect(screen.getByText(/a program, not a company/)).toBeTruthy();
    // the active lane's steps number 01–03, mono accent
    const ordinals = [...container.querySelectorAll('[data-slot="flow-step"] [data-num]')].map(
      (n) => n.textContent,
    );
    expect(ordinals).toEqual(["01", "02", "03"]);
    for (const n of container.querySelectorAll('[data-slot="flow-step"] [data-num]')) {
      expect(n.className).toContain("text-accent");
      expect(n.className).toContain("font-mono");
    }
  });

  it("hovering a card previews its lane in the pane", () => {
    render(<Mechanism />);
    fireEvent.mouseEnter(screen.getByRole("tab", { name: /Joining the pool/ }));
    expect(screen.getByText("Accept the terms")).toBeTruthy();
    expect(screen.getByText("Pay the entry")).toBeTruthy();
    expect(screen.getByText(/the funders are the pool/)).toBeTruthy();
    expect(screen.getByText(/no admin key, no discretionary signer/)).toBeTruthy();
    expect(screen.queryByText("One transaction")).toBeNull();
  });

  it("focusing the drawing card (keyboard or tap parity) shows the claim lane", () => {
    render(<Mechanism />);
    // browsers focus a trigger on click; Radix activates on focus — and
    // the band's own onFocus handler mirrors it for jsdom
    fireEvent.focus(screen.getByRole("tab", { name: /Drawing on the pool/ }));
    expect(screen.getByText("File a payout request")).toBeTruthy();
    expect(screen.getByText(/never more than the pool holds/)).toBeTruthy();
    const accord = screen.getByRole("link", { name: "Accord" });
    expect(accord.getAttribute("href")).toBe("https://useaccord.xyz");
  });
});
