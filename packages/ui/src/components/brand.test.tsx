import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LogoLockup } from "./chrome/LogoLockup";
import { BLUE_INDEX, GAP_INDEX, Logomark, slotPosition } from "./chrome/Logomark";
import { Wordmark } from "./chrome/Wordmark";

afterEach(cleanup);

describe("Logomark (the ring)", () => {
  it("renders 7 stones: 8 slots, one deliberately empty", () => {
    const { container } = render(<Logomark />);
    expect(container.querySelectorAll("polygon")).toHaveLength(7);
  });

  it("renders exactly one harbor-blue stone — the newest member", () => {
    const { container } = render(<Logomark />);
    const blue = container.querySelectorAll('polygon[fill="var(--riprap-accent)"]');
    const grey = container.querySelectorAll('polygon[fill="var(--riprap-stone)"]');
    expect(blue).toHaveLength(1);
    expect(grey).toHaveLength(6);
  });

  it("keeps the gap empty at the open-membership slot (lower-right)", () => {
    const { container } = render(<Logomark />);
    const gap = slotPosition(GAP_INDEX);
    for (const g of container.querySelectorAll("svg > g")) {
      const t = g.getAttribute("transform") ?? g.getAttribute("style") ?? "";
      // no stone group may sit at the gap slot's position
      expect(t).not.toContain(`${Math.round(gap.x)} ${Math.round(gap.y)}`);
    }
  });

  it("renders every stone at its slot position — no double translation (viewport bug)", () => {
    const { container } = render(<Logomark />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    const inner = Array.from(svg!.querySelectorAll("g > g"));
    expect(inner.length).toBe(7);
    const slotCoords = new Set(
      [...Array(8).keys()]
        .filter((i) => i !== GAP_INDEX)
        .map((i) => `${slotPosition(i).x.toFixed(2)} ${slotPosition(i).y.toFixed(2)}`),
    );
    for (const g of inner) {
      // the inner group carries the full slot position exactly once
      const m = g.getAttribute("transform")?.match(/translate\(([-\d.]+) ([-\d.]+)\)/);
      expect(m).not.toBeNull();
      expect(slotCoords.has(`${Number(m![1]).toFixed(2)} ${Number(m![2]).toFixed(2)}`)).toBe(true);
      // ...and the motion wrapper must NOT add a second translate of the same
      // magnitude (the bug that pushed the ring to 2x coordinates, off-canvas)
      const wrapper = g.parentElement;
      const wTransform = `${wrapper?.getAttribute("transform") ?? ""} ${wrapper?.getAttribute("style") ?? ""}`;
      expect(wTransform).not.toMatch(/translate[XY]?\(\s*(4[8-9]|[5-9]\d)\.?\d*(px)?/);
    }
  });
  it("is deterministic — the same mark every render (fixed seeds)", () => {
    const { container: a } = render(<Logomark />);
    const first = Array.from(a.querySelectorAll("polygon")).map((p) => p.getAttribute("points"));
    cleanup();
    const { container: b } = render(<Logomark />);
    const second = Array.from(b.querySelectorAll("polygon")).map((p) => p.getAttribute("points"));
    expect(first).toEqual(second);
  });

  it("is an accessible image naming the ring", () => {
    render(<Logomark />);
    expect(screen.getByRole("img", { name: /open ring of stones/i })).toBeTruthy();
  });
});

describe("Wordmark", () => {
  it("sets the wordmark per DESIGN.md: lowercase, 700, kissed tracking", () => {
    render(<Wordmark />);
    const el = screen.getByText("riprap");
    expect(el.textContent).toBe("riprap");
    const cs = el.style;
    expect(cs.fontWeight).toBe("700");
    expect(cs.fontFamily).toBe("var(--riprap-font-prose)"); // resolves to Space Grotesk via tokens
  });
});

describe("LogoLockup", () => {
  it("composes mark + wordmark under a single aria label", () => {
    render(<LogoLockup />);
    const lockup = screen.getByRole("img", { name: "riprap" });
    expect(lockup).toBeTruthy();
    expect(lockup.textContent).toContain("riprap");
    // the inner logomark keeps its own, distinct description
    expect(screen.getByRole("img", { name: /open ring of stones/i })).toBeTruthy();
  });

  it("mark-only lockup hides the wordmark but keeps the ring", () => {
    const { container } = render(<LogoLockup wordmark={false} />);
    expect(container.querySelectorAll("polygon")).toHaveLength(7);
    expect(screen.queryByText("riprap")).toBeNull();
  });

  it("the blue stone sits adjacent to the gap — the newest arrival", () => {
    // layout contract: blue slot counterclockwise-adjacent to the gap slot
    expect((BLUE_INDEX + 1) % 8).toBe(GAP_INDEX);
  });
});
