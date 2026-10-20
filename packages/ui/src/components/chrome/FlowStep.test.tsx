import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Join } from "../../illustrations/Join";
import { FlowStep } from "./FlowStep";

/** a stand-in glyph: the real ones carry their own tests (illustrations.test.tsx) */
function StubGlyph() {
  return <svg data-glyph="stub" viewBox="0 0 96 96" />;
}

describe("FlowStep — one step of a flow: ordinal, glyph, headline, body", () => {
  it("renders its accent mono ordinal, glyph, headline, and body text", () => {
    const { container, getByText } = render(
      <FlowStep step="01" Glyph={StubGlyph} headline="Fund the pool">
        Members pay their share into the pool.
      </FlowStep>,
    );
    expect(container.querySelector('[data-glyph="stub"]')).toBeTruthy();
    const ordinal = getByText("01");
    expect(ordinal.getAttribute("data-num")).toBe("true");
    // the ordinal is the accent (DESIGN.md: harbor-blue, numbers in mono)
    expect(ordinal.className).toContain("text-accent");
    expect(ordinal.className).toContain("font-mono");
    expect(getByText("Fund the pool").tagName).toBe("H3");
    expect(getByText("Members pay their share into the pool.")).toBeTruthy();
  });

  it("hides the glyph from assistive tech — the headline carries the meaning", () => {
    const { container } = render(
      <FlowStep step="02" Glyph={Join} headline="One more member.">
        Anyone joins while membership is open.
      </FlowStep>,
    );
    const glyph = container.querySelector('[data-glyph="join"]');
    expect(glyph).toBeTruthy();
    expect(glyph?.closest('[data-slot="flow-step"] > div')?.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });
});
