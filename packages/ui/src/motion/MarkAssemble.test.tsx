import { readFileSync } from "node:fs";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SvgFrame } from "../atoms/SvgFrame";
import { MarkAssemble } from "./MarkAssemble";
import { SETTLE, SETTLE_EASE, SETTLE_FAST, STAGGER } from "./settle";

/* reduced-motion toggle — useReducedMotion is mocked per test */
const state = vi.hoisted(() => ({ reduced: false }));
vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, useReducedMotion: () => state.reduced };
});

afterEach(() => {
  state.reduced = false;
  cleanup();
});

function mark() {
  return render(
    <SvgFrame width={240} height={180} title="mark">
      <MarkAssemble x={120} y={150} />
    </SvgFrame>,
  );
}

describe("MarkAssemble", () => {
  it("the mark is 8 stones: 7 stone-grey + 1 harbor-blue crest (DESIGN.md)", () => {
    const { container } = mark();
    const fills = Array.from(container.querySelectorAll("polygon")).map((p) =>
      p.getAttribute("fill"),
    );
    expect(fills).toHaveLength(8);
    expect(fills.filter((f) => f === "var(--riprap-diagram-stone)")).toHaveLength(7);
    expect(fills.filter((f) => f === "var(--riprap-funds)")).toHaveLength(1);
  });

  it("the crest lands LAST — after every grey stone in the sequence", () => {
    const { container } = mark();
    const fills = Array.from(container.querySelectorAll("polygon")).map((p) =>
      p.getAttribute("fill"),
    );
    expect(fills.indexOf("var(--riprap-funds)")).toBe(7); // crest is the final stone
    // every stone is its own motion group — the sequence exists and is stagger-able
    expect(container.querySelectorAll("svg > g > g")).toHaveLength(8);
  });

  it("reduced motion renders the settled mark — identical geometry to the animated end state", () => {
    const normal = mark();
    const settledNormal = Array.from(normal.container.querySelectorAll("polygon")).map((p) =>
      p.getAttribute("points"),
    );
    cleanup();
    state.reduced = true;
    const reduced = mark();
    const settledReduced = Array.from(reduced.container.querySelectorAll("polygon")).map((p) =>
      p.getAttribute("points"),
    );
    expect(settledReduced).toEqual(settledNormal); // favicon/print = settled, always
  });

  it("settle timing: the JS constants pin the tokens.css contract", () => {
    const css = readFileSync("src/tokens.css", "utf8"); // vitest runs from the package root
    // the frozen CSS tokens (DESIGN.md: ease-out ~160ms, stagger 40ms)
    expect(css).toMatch(/--riprap-settle: 160ms cubic-bezier\(0\.215, 0\.61, 0\.355, 1\)/);
    expect(css).toMatch(/--riprap-settle-fast: 120ms/);
    expect(css).toMatch(/--riprap-stagger: 40ms/);
    // the motion values mirror them exactly
    expect(SETTLE).toBe(0.16);
    expect(SETTLE_FAST).toBe(0.12);
    expect(STAGGER).toBe(0.04);
    expect(SETTLE_EASE).toEqual([0.215, 0.61, 0.355, 1]);
  });
});
