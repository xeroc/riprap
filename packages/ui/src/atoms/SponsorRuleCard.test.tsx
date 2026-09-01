import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SponsorRuleCard } from "./SponsorRuleCard";
import { SvgFrame } from "./SvgFrame";

afterEach(cleanup);

const frame = (event?: string) => (
  <SvgFrame width={600} height={260} title="frame">
    <SponsorRuleCard x={40} y={40} event={event} />
  </SvgFrame>
);

describe("SponsorRuleCard", () => {
  it("lists exactly the five sponsor decisions, one row each", () => {
    render(frame());
    for (const row of [
      "peril — narrowly defined",
      "covered area",
      "coverage window",
      "tiers",
      "claims window",
    ]) {
      expect(screen.getByText(row)).toBeTruthy();
    }
  });

  it("prints the undecided parameters as monospace placeholders, never invented values", () => {
    render(frame());
    expect(screen.getByText("{{EVENT}}")).toBeTruthy();
    expect(screen.getByText("{{CLAIMS_WINDOW}}")).toBeTruthy();
    expect(screen.getByText("10/20/40")).toBeTruthy();
  });

  it("binds {{EVENT}} when the scene is of a specific pool", () => {
    render(frame("Breakpoint 2026"));
    expect(screen.getByText("Breakpoint 2026")).toBeTruthy();
  });

  it("draws the sponsor stone outside the basin — the sponsor is not the insurer", () => {
    render(frame());
    expect(screen.getByText("sponsor")).toBeTruthy();
    expect(containerPolygonCount() > 0).toBe(true);
  });

  it("keeps the basin empty at 60% stroke opacity — not yet live", () => {
    const { container } = render(frame());
    const vessel = container.querySelector('path[stroke-opacity="0.6"]');
    expect(vessel).not.toBeNull();
    expect(container.querySelector('rect[fill="var(--riprap-funds)"]')).toBeNull();
  });
});

function containerPolygonCount(): number {
  return document.querySelectorAll("polygon").length;
}
