import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { WorkedExampleReceipt } from "../components/chrome/WorkedExampleReceipt";
import { Claim } from "./Claim";
import { Gather } from "./Gather";
import { GlyphClockProvider, SETTLE, STAGGER } from "./Glyph";
import { HexBackdrop } from "./HexBackdrop";
import { Join } from "./Join";

/*
 * The glyph clock (GlyphClockProvider) is the deterministic video lane:
 * every animated glyph must be a pure function of frame/fps, matching the
 * wall-clock settle exactly (lib/settle.ts + DESIGN.md § Motion).
 */

// jsdom has no IntersectionObserver; WorkedExampleReceipt's web lane constructs
// one unconditionally (hooks cannot be conditional) — stub the constructor.
beforeAll(() => {
  globalThis.IntersectionObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  } as unknown as typeof IntersectionObserver;
});

afterEach(cleanup);

/** render a glyph under a clock at `frame` @30fps */
function atFrame(frame: number, ui: React.ReactNode) {
  return render(<GlyphClockProvider clock={{ frame, fps: 30 }}>{ui}</GlyphClockProvider>);
}

describe("SettleGroup under a glyph clock (Join)", () => {
  it("frame 0: every stone invisible, 12px up", () => {
    const { container } = atFrame(0, <Join />);
    const groups = [...container.querySelectorAll("g[style]")];
    expect(groups.length).toBe(4);
    for (const g of groups) {
      expect((g as SVGGElement).style.opacity).toBe("0");
      expect((g as SVGGElement).style.transform).toContain("-12px");
    }
  });

  it("1s in: all four stones settled (last delay 0.16 + settle 0.16)", () => {
    const { container } = atFrame(30, <Join />);
    for (const g of [...container.querySelectorAll("g[style]")]) {
      expect((g as SVGGElement).style.opacity).toBe("1");
      expect((g as SVGGElement).style.transform).toContain("0px");
    }
  });

  it("mid-arrival: first stone more arrived than the last (stagger holds)", () => {
    const { container } = atFrame(4, <Join />); // t≈0.133s
    const opacities = [...container.querySelectorAll("g[style]")].map((g) =>
      Number((g as SVGGElement).style.opacity),
    );
    expect(opacities.length).toBe(4);
    expect(opacities[0]).toBeGreaterThan(opacities[3]);
    expect(opacities[3]).toBe(0); // delay 0.16s not reached at 0.133s
  });
});

describe("Gather under a glyph clock", () => {
  it("frame 0: level height 0, resting on the floor", () => {
    const { container } = atFrame(0, <Gather />);
    const fill = container.querySelector('rect[fill="var(--riprap-funds)"]');
    expect(fill).not.toBeNull();
    expect(fill?.getAttribute("height")).toBe("0");
    expect((fill as SVGRectElement).style.transform).toContain("68.5px"); // floorY
  });

  it("settled: level at 60% of the interior, dashed line visible", () => {
    const { container } = atFrame(30, <Gather />);
    const fill = container.querySelector('rect[fill="var(--riprap-funds)"]') as SVGRectElement;
    expect(Number(fill.getAttribute("height"))).toBeCloseTo(37 * 0.6, 6);
    const line = container.querySelector('line[stroke-dasharray="4 3"]');
    expect(line).not.toBeNull();
    expect((line as SVGLineElement).style.opacity).toBe("1");
  });
});

describe("Claim under a glyph clock", () => {
  it("frame 0: paid block still inside (no travel)", () => {
    const { container } = atFrame(0, <Claim />);
    const rects = [...container.querySelectorAll('rect[fill="var(--riprap-funds)"]')];
    const block = rects.find((r) => r.getAttribute("width") === "10") as SVGRectElement;
    expect(block).toBeDefined();
    expect(block.style.transform).toContain("0px");
  });

  it("settled: block travelled the full door distance (22 units)", () => {
    const { container } = atFrame(30, <Claim />);
    const block = [...container.querySelectorAll('rect[fill="var(--riprap-funds)"]')].find(
      (r) => r.getAttribute("width") === "10",
    ) as SVGRectElement;
    expect(block.style.transform).toContain("22px");
    // the two-door law: the vessel drew its door gap
    const walls = [...container.querySelectorAll("line")];
    expect(walls.length).toBe(4); // left, floor, right split in two
  });
});

describe("HexBackdrop under a glyph clock", () => {
  it("is deterministic: same frame, same opacities", () => {
    const a = atFrame(42, <HexBackdrop width={400} height={240} />).container;
    const opacities = [...a.querySelectorAll("[data-breathe]")].map((el) =>
      el.getAttribute("style"),
    );
    const b = atFrame(42, <HexBackdrop width={400} height={240} />).container;
    const again = [...b.querySelectorAll("[data-breathe]")].map((el) => el.getAttribute("style"));
    expect(opacities).toEqual(again);
  });

  it("no motion state: breathers are plain polygons driven by the clock", () => {
    const { container } = atFrame(90, <HexBackdrop width={400} height={240} />);
    const breather = container.querySelector("[data-breathe]") as SVGElement;
    expect(breather.tagName).toBe("polygon");
    expect(breather.getAttribute("style")).toMatch(/opacity/);
  });
});

describe("WorkedExampleReceipt under a glyph clock", () => {
  const lines = [
    { value: "1,000", caption: "members" },
    { value: "$20,000", caption: "pool" },
  ];
  const total = { value: "$12,000", caption: "returned" };
  const receipt = <WorkedExampleReceipt lines={lines} total={total} staggerMs={400} />;

  /** every arriving row: the line items then the total, in arrival order */
  const rows = (container: HTMLElement) =>
    [...container.querySelectorAll("li, [data-total]")] as HTMLElement[];

  it("lines arrive one per stagger slot, reading order, total last", () => {
    const start = atFrame(0, receipt).container;
    expect(rows(start).map((r) => r.style.opacity)).toEqual(["0", "0", "0"]);

    const late = atFrame(60, receipt).container; // t=2s
    for (const r of rows(late)) {
      expect(r.style.opacity).toBe("1");
    }
  });

  it("mid-flight: first line settled, total not yet (400ms slots)", () => {
    const container = atFrame(24, receipt).container; // t=0.8s
    const opacities = rows(container).map((r) => r.style.opacity);
    expect(opacities[0]).toBe("1");
    expect(Number(opacities[2])).toBe(0); // total's delay 0.8s not reached at 0.8s
  });
});

// keep the constants honest against the clock math used above
expect(SETTLE).toBe(0.16);
expect(STAGGER).toBe(0.04);
