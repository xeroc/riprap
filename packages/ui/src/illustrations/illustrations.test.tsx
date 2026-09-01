import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type * as MotionReact from "motion/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GlyphTile } from "../components/chrome/GlyphTile";
import { Claim } from "./Claim";
import { End } from "./End";
import { Gather } from "./Gather";
import { HexBackdrop } from "./HexBackdrop";
import { Join } from "./Join";
import { HOVER_LOOP_MS, LifecycleStrip } from "./LifecycleStrip";
import { Return } from "./Return";
import { Rule } from "./Rule";

// controllable reduced-motion flag — same pattern as chrome.test.tsx
let reducedMotion = false;
vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof MotionReact>();
  return {
    ...actual,
    useReducedMotion: () => reducedMotion,
  };
});

afterEach(() => {
  cleanup();
  reducedMotion = false;
});

/** all fill/stroke colors in a glyph tree — must be var(--riprap-*) refs only */
function colorAttrs(container: HTMLElement): string[] {
  return [...container.querySelectorAll("[fill],[stroke]")]
    .flatMap((el) => [el.getAttribute("fill"), el.getAttribute("stroke")])
    .filter((v): v is string => Boolean(v));
}

const SIX = [
  ["gather", Gather],
  ["join", Join],
  ["claim", Claim],
  ["rule", Rule],
  ["return", Return],
  ["end", End],
] as const;

describe("glyphs — one concept each, sharp geometry, token colors", () => {
  for (const [name, Glyph] of SIX) {
    it(`${name}: renders its frame, no rounded corners, no hex colors`, () => {
      const { container } = render(<Glyph />);
      const svg = container.querySelector(`[data-glyph="${name}"]`);
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute("role")).toBe("img");
      // zero rounded geometry — no rx/ry anywhere
      for (const el of container.querySelectorAll("rect")) {
        expect(el.hasAttribute("rx"), name).toBe(false);
        expect(el.hasAttribute("ry"), name).toBe(false);
      }
      // colors only via tokens
      for (const c of colorAttrs(container)) {
        expect(c, `${name}: ${c}`).toMatch(/^var\(--riprap-/);
      }
    });

    it(`${name}: renders every node statically under reduced motion`, () => {
      reducedMotion = true;
      const { container } = render(<Glyph />);
      expect(container.querySelector(`[data-glyph="${name}"]`)).toBeTruthy();
    });
  }

  it("gather: vessel + funds level + dashed ink surface line", () => {
    const { container } = render(<Gather />);
    const lines = container.querySelectorAll("line");
    expect(lines.length).toBe(4); // 3 walls + 1 dashed level line
    const dashed = [...lines].find((l) => l.getAttribute("stroke-dasharray"));
    expect(dashed?.getAttribute("stroke")).toBe("var(--riprap-diagram-ink)");
    expect(container.querySelector('rect[fill="var(--riprap-funds)"]')).toBeTruthy();
  });

  it("join: three stone members + the accent newest member landing last", () => {
    const { container } = render(<Join />);
    const rects = container.querySelectorAll("rect");
    expect(rects.length).toBe(4);
    const fills = [...rects].map((r) => r.getAttribute("fill"));
    expect(fills.filter((f) => f === "var(--riprap-diagram-stone)")).toHaveLength(3);
    expect(fills.filter((f) => f === "var(--riprap-accent)")).toHaveLength(1);
  });

  it("claim: exactly one door gap in the vessel; the paid block is funds", () => {
    const { container } = render(<Claim />);
    // door open: right wall split in two → 4 lines (vs 3 when shut)
    expect(container.querySelectorAll("line").length).toBe(4);
    expect(container.querySelectorAll('rect[fill="var(--riprap-funds)"]').length).toBe(2);
  });

  it("rule: three peers, the majority carries deliberation", () => {
    const { container } = render(<Rule />);
    const fills = [...container.querySelectorAll("rect")].map((r) => r.getAttribute("fill"));
    expect(fills.filter((f) => f === "var(--riprap-deliberation)")).toHaveLength(2);
    expect(fills.filter((f) => f === "var(--riprap-diagram-stone)")).toHaveLength(1);
  });

  it("return: empty vessel above, six equal funds shares below", () => {
    const { container } = render(<Return />);
    const shares = [...container.querySelectorAll("rect")].filter(
      (r) => r.getAttribute("fill") === "var(--riprap-funds)",
    );
    expect(shares.length).toBe(6);
    const widths = new Set(shares.map((s) => s.getAttribute("width")));
    expect(widths.size).toBe(1); // equal shares — pro-rata is the concept
  });

  it("end: the vessel in four loose segments, no money anywhere", () => {
    const { container } = render(<End />);
    expect(container.querySelectorAll("line").length).toBe(4);
    expect(container.querySelector("rect")).toBeNull();
  });
});

describe("GlyphTile — concept on a registered plate", () => {
  it("stamps ordinal + plain-word label in mono; carries plate ticks", () => {
    const { container } = render(
      <GlyphTile step="01" label="money gathers">
        <Gather />
      </GlyphTile>,
    );
    expect(screen.getByText("01").className).toContain("[font:var(--riprap-mono-label)]");
    expect(screen.getByText("money gathers").className).toContain(
      "[font:var(--riprap-mono-label)]",
    );
    expect(screen.getByText("money gathers").className).toContain("uppercase");
    expect(container.querySelector('[data-slot="plate-ticks"]')).toBeTruthy();
    expect(container.querySelector('[data-slot="glyph-tile"]')?.className).not.toContain(
      "rounded-",
    );
  });
});

describe("LifecycleStrip — the whole product in six plates", () => {
  it("renders six ordered steps, one concept each, no technical terms", () => {
    const { container } = render(<LifecycleStrip />);
    const steps = [...container.querySelectorAll("li")];
    expect(steps.length).toBe(6);
    expect(steps.map((li) => li.getAttribute("data-step"))).toEqual([
      "join",
      "gather",
      "rule",
      "claim",
      "return",
      "end",
    ]);
    for (const ord of ["01", "02", "03", "04", "05", "06"]) {
      expect(screen.getByText(ord).className).toContain("[font:var(--riprap-mono-label)]");
    }
  });

  it("hover replays that tile's arrival in a loop; leaving stops it (arrive and stay)", () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<LifecycleStrip />);
      const joinLi = container.querySelector("li[data-step='join']");
      if (!joinLi) throw new Error("join tile not rendered");
      const joinSvg = () => container.querySelector('svg[data-glyph="join"]');

      const initial = joinSvg();
      fireEvent.mouseEnter(joinLi);
      expect(joinSvg()).not.toBe(initial); // first replay is immediate

      const onHover = joinSvg();
      act(() => {
        vi.advanceTimersByTime(HOVER_LOOP_MS + 10);
      });
      expect(joinSvg()).not.toBe(onHover); // then it loops

      const looped = joinSvg();
      fireEvent.mouseLeave(joinLi);
      act(() => {
        vi.advanceTimersByTime(HOVER_LOOP_MS * 3);
      });
      expect(joinSvg()).toBe(looped); // stopped — the glyph stays arrived
    } finally {
      vi.useRealTimers();
    }
  });

  it("hover loop under reduced motion leaves every group settled", () => {
    reducedMotion = true;
    vi.useFakeTimers();
    try {
      const { container } = render(<LifecycleStrip />);
      const joinLi = container.querySelector("li[data-step='join']");
      if (!joinLi) throw new Error("join tile not rendered");
      fireEvent.mouseEnter(joinLi);
      act(() => {
        vi.advanceTimersByTime(HOVER_LOOP_MS * 2);
      });
      // join's four member squares are SettleGroups — under reduced motion
      // every loop replay must still render settled (never opacity 0)
      const groups = container.querySelectorAll<SVGElement>('svg[data-glyph="join"] g');
      expect(groups.length).toBeGreaterThan(0);
      for (const g of groups) {
        expect(g.style.opacity).not.toBe("0");
      }
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("HexBackdrop — the hero's engineering paper", () => {
  it("is a decorative lattice: aria-hidden, sliced to cover, token colors only", () => {
    const { container } = render(<HexBackdrop />);
    const svg = container.querySelector('[data-slot="hex-backdrop"]');
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.getAttribute("preserveAspectRatio")).toBe("xMidYMid slice");
    const strokes = [...container.querySelectorAll("[stroke]")].map((e) =>
      e.getAttribute("stroke"),
    );
    for (const s of strokes) expect(s === "none" || s?.startsWith("var(--riprap-")).toBe(true);
    const fills = [...container.querySelectorAll("[fill]")].map((e) => e.getAttribute("fill"));
    for (const f of fills) expect(f === "none" || f?.startsWith("var(--riprap-")).toBe(true);
  });

  it("lattice static from first paint; the only fills are breathing cells", () => {
    const { container } = render(<HexBackdrop />);
    // lattice: static paths, 1px faint hairline, edge bands recede a step
    const lattice = [...container.querySelectorAll("path[fill='none']")];
    expect(lattice.length).toBeGreaterThan(5);
    for (const p of lattice) {
      expect(p.getAttribute("stroke")).toBe("var(--riprap-hairline-soft)");
      expect(p.getAttribute("stroke-width")).toBe("1");
    }
    // a cell either breathes or does nothing — no static fills exist
    const polygons = [...container.querySelectorAll("polygon[fill]")];
    expect(polygons.length).toBeGreaterThan(10);
    for (const p of polygons) {
      expect(p.getAttribute("data-breathe")).toBe("true");
      expect(p.getAttribute("fill")).toBe("var(--riprap-surface-strong)");
    }
  });

  it("renders the completed pattern under reduced motion", () => {
    reducedMotion = true;
    const { container } = render(<HexBackdrop />);
    expect(container.querySelectorAll("path[fill='none']").length).toBeGreaterThan(5);
    expect(container.querySelectorAll("polygon[fill]").length).toBeGreaterThan(10);
  });

  it("breathers: every filled cell fades the emphasized tone in and out — never brighter", () => {
    const { container } = render(<HexBackdrop />);
    const breathers = [...container.querySelectorAll('[data-breathe="true"]')];
    expect(breathers.length).toBeGreaterThan(0);
    // nothing besides breathers is ever filled
    expect(container.querySelectorAll("polygon:not([data-breathe])").length).toBe(0);
    // surface-strong is the emphasized ceiling; a breather never exceeds it
    for (const p of breathers) {
      expect(p.getAttribute("fill")).toBe("var(--riprap-surface-strong)");
    }
  });

  it("breathers collapse to static mid-tone cells under reduced motion", () => {
    reducedMotion = true;
    const { container } = render(<HexBackdrop />);
    const breathers = [...container.querySelectorAll('[data-breathe="true"]')];
    expect(breathers.length).toBeGreaterThan(0);
    for (const p of breathers) {
      expect((p as SVGElement).style.opacity).toBe("0.5");
    }
    // the paper itself remains complete
    expect(container.querySelectorAll("path[fill='none']").length).toBeGreaterThan(5);
    expect(container.querySelectorAll("polygon[fill]").length).toBeGreaterThan(10);
  });
});
