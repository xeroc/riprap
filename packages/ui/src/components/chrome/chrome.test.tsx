import { act, cleanup, render, screen } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { TIERS, usd } from "../../lib/poolMath";
import { BadgeStamp } from "./BadgeStamp";
import { Container } from "./Container";
import { CTABand } from "./CTABand";
import { DissolutionBand } from "./DissolutionBand";
import { FeatureCard } from "./FeatureCard";
import { FooterBand } from "./FooterBand";
import { MechanismCard } from "./MechanismCard";
import { SectionBand } from "./SectionBand";
import { StampBadge } from "./StampBadge";
import { TextLink } from "./TextLink";
import { TierCard } from "./TierCard";
import { TopNav } from "./TopNav";
import { WorkedExampleBand } from "./WorkedExampleBand";

// controllable reduced-motion flag — motion caches matchMedia support at
// import time (jsdom has none), so the hook itself is mocked
let reducedMotion = false;
vi.mock("motion/react", async (importOriginal) => {
  const actual: object = await importOriginal();
  return { ...actual, useReducedMotion: () => reducedMotion };
});

// scroll-arrival driver: jsdom ships an IntersectionObserver that never
// fires, so tests stub one they can trigger by hand
const observers: { fire: (intersecting: boolean) => void }[] = [];
class IntersectionObserverStub implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds: readonly number[] = [];
  private callback: IntersectionObserverCallback;
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    observers.push({
      fire: (intersecting: boolean) =>
        this.callback([{ isIntersecting: intersecting } as IntersectionObserverEntry], this),
    });
  }
  readonly scrollMargin = "";
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

afterEach(cleanup);

// fake timers drive the worked-example arrival cadence deterministically
beforeAll(() => {
  vi.useFakeTimers();
  vi.stubGlobal("IntersectionObserver", IntersectionObserverStub);
});
afterAll(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const FIGURES = [
  { value: "1,000", caption: "members" },
  { value: "$20,000", caption: "pool" },
  { value: "$12", caption: "back each" },
];

describe("TopNav — DESIGN.md § top-nav", () => {
  it("renders mono links, sign-in and the single primary CTA", () => {
    render(
      <TopNav
        links={[
          { href: "#platform", label: "Platform" },
          { href: "#blade-pool", label: "Blade Pool" },
        ]}
        signIn={{ href: "#sign-in", label: "Sign In" }}
        cta={{ href: "#join", label: "Join the pool" }}
        brand={<span>riprap</span>}
      />,
    );
    expect(screen.getByRole("navigation", { name: "Main" })).toBeTruthy();
    const link = screen.getByText("Platform");
    expect(link.className).toContain("[font:var(--riprap-mono-label)]");
    expect(link.className).toContain("uppercase");
    expect(screen.getByText("Join the pool")).toBeTruthy();
    const cta = screen.getByRole("link", { name: "Join the pool" });
    expect(cta.className).toContain("bg-primary");
  });

  it("carries a hamburger below 768px opening a mono drawer", () => {
    render(
      <TopNav
        links={[{ href: "#faq", label: "FAQ" }]}
        cta={{ href: "#join", label: "Join the pool" }}
      />,
    );
    const burger = screen.getByRole("button", { name: "Open menu" });
    expect(burger.className).toContain("md:hidden");
  });

  it("is 64px tall with a hairline bottom rule", () => {
    const { container } = render(<TopNav links={[]} />);
    const header = container.querySelector('[data-slot="top-nav"]');
    expect(header?.className).toContain("border-b");
    expect(header?.className).toContain("border-hairline");
    const bar = container.querySelector('[data-slot="container"]');
    expect(bar?.className).toContain("h-(--riprap-nav-h)");
  });
});

describe("StampBadge — the instance lockup", () => {
  it("prints the lockup pattern ': POOL @ EVENT' in uppercase", () => {
    render(<StampBadge pool="Blade Pool" event="Breakpoint" />);
    expect(screen.getByText(": BLADE POOL @ BREAKPOINT")).toBeTruthy();
  });

  it("harbor-blue mono on a hairline-strong stamp, radius 0", () => {
    render(<StampBadge pool="Blade Pool" />);
    const el = screen.getByText(/BLADE POOL/);
    expect(el.className).toContain("text-(--riprap-accent)");
    expect(el.className).toContain("border-hairline-strong");
    expect(el.className).toContain("rounded-none");
    expect(el.className).toContain("[font:var(--riprap-mono-label)]");
    expect(el.className).toContain("uppercase");
  });
});

describe("BadgeStamp", () => {
  it("stone text, transparent ground, hairline edge, mono uppercase", () => {
    render(<BadgeStamp>juror pool</BadgeStamp>);
    const el = screen.getByText("juror pool");
    expect(el.className).toContain("text-stone");
    expect(el.className).toContain("border-hairline");
    expect(el.className).toContain("rounded-none");
    expect(el.className).not.toContain("bg-");
  });
});

describe("TierCard — numbers are the hero", () => {
  it("prints fee and cap in mono-number-lg, tier name in mono-label (policy §5)", () => {
    const standard = TIERS[1]; // $20 / up to $2,000
    render(<TierCard name={standard.name} fee={standard.fee} cap={standard.cap} />);
    const name = screen.getByText(standard.name);
    expect(name.className).toContain("uppercase"); // CSS-case, text stays as sourced
    expect(name.className).toContain("[font:var(--riprap-mono-label)]");
    expect(screen.getByText(usd(standard.fee))).toBeTruthy();
    expect(screen.getByText(`up to ${usd(standard.cap)}`)).toBeTruthy();
    const numbers = screen.getAllByText(/\$[\d,]+/);
    for (const n of numbers) {
      expect(n.className).toContain("[font:var(--riprap-mono-number-lg)]");
      expect(n.hasAttribute("data-num")).toBe(true);
    }
  });

  it("card anatomy: card ground, hairline, radius 0, 32px padding, no illustration", () => {
    const { container } = render(<TierCard name="Basic" fee={TIERS[0].fee} cap={TIERS[0].cap} />);
    const card = container.querySelector('[data-slot="tier-card"]') as HTMLElement;
    expect(card.className).toContain("bg-card");
    expect(card.className).toContain("border-hairline");
    expect(card.className).toContain("rounded-none");
    expect(card.className).toContain("p-8");
    expect(container.querySelector("svg")).toBeNull(); // no illustration inside
  });
});

describe("FeatureCard", () => {
  it("renders title + body on a card plate (24px padding)", () => {
    const { container } = render(
      <FeatureCard title="Two doors, never three">body copy</FeatureCard>,
    );
    const card = container.querySelector('[data-slot="feature-card"]') as HTMLElement;
    expect(card.className).toContain("bg-card");
    expect(card.className).toContain("p-6");
    expect(card.className).toContain("rounded-none");
    expect(screen.getByText("Two doors, never three")).toBeTruthy();
  });
});

describe("MechanismCard", () => {
  it("is a diagram container: label rules the top, diagram renders inside", () => {
    const diagram = (
      <svg data-testid="diagram" viewBox="0 0 10 10" role="img" aria-label="diagram fixture">
        <rect width="10" height="10" />
      </svg>
    );
    render(<MechanismCard title="two doors">{diagram}</MechanismCard>);
    const label = screen.getByText("two doors");
    expect(label.className).toContain("[font:var(--riprap-mono-label)]");
    expect(screen.getByTestId("diagram")).toBeTruthy();
  });
});

describe("WorkedExampleBand — numbers arrive one at a time", () => {
  it("staggered arrival in prop order, 40ms apart (--riprap-stagger)", () => {
    render(<WorkedExampleBand figures={FIGURES} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);

    // before the band scrolls into view: nothing arrived
    expect(items[0].getAttribute("data-arrived")).toBe("false");

    // the band enters the viewport → arrival timers start
    act(() => observers[observers.length - 1].fire(true));
    expect(items[0].getAttribute("data-arrived")).toBe("false");

    act(() => vi.advanceTimersByTime(1)); // t=1ms: figure 1 settled
    expect(items[0].getAttribute("data-arrived")).toBe("true");
    expect(items[1].getAttribute("data-arrived")).toBe("false");

    act(() => vi.advanceTimersByTime(38)); // t=39ms: still only figure 1
    expect(items[1].getAttribute("data-arrived")).toBe("false");

    act(() => vi.advanceTimersByTime(1)); // t=40ms: figure 2 settles
    expect(items[1].getAttribute("data-arrived")).toBe("true");
    expect(items[2].getAttribute("data-arrived")).toBe("false");

    act(() => vi.advanceTimersByTime(40)); // t=80ms: figure 3 settles
    expect(items[2].getAttribute("data-arrived")).toBe("true");
  });

  it("renders every figure statically under prefers-reduced-motion", () => {
    reducedMotion = true;
    try {
      render(<WorkedExampleBand figures={FIGURES} />);
      const items = screen.getAllByRole("listitem");
      for (const item of items) {
        expect(item.getAttribute("data-arrived")).toBe("true");
        expect(item.className).not.toContain("opacity-0");
      }
    } finally {
      reducedMotion = false;
    }
  });

  it("figures carry mono-number-lg on mostly empty ground", () => {
    render(<WorkedExampleBand figures={FIGURES} />);
    act(() => observers[observers.length - 1].fire(true));
    vi.advanceTimersByTime(200);
    const first = screen.getByText("1,000").closest("li");
    expect(first?.className).toContain("[font:var(--riprap-mono-number-lg)]");
    expect(first?.hasAttribute("data-num")).toBe(true);
  });
});

describe("CTABand", () => {
  it("ground-soft band, hairlines above and below, ONE warm-white CTA", () => {
    const { container } = render(
      <CTABand
        headline="The pool opens when the event does."
        cta={{ href: "#join", label: "Join the pool" }}
      />,
    );
    const band = container.querySelector('[data-slot="cta-band"]') as HTMLElement;
    expect(band.className).toContain("bg-ground-soft");
    expect(band.className).toContain("border-y");
    expect(band.className).toContain("border-hairline");
    const primaries = container.querySelectorAll(".bg-primary");
    expect(primaries.length).toBe(1);
    expect(screen.getByRole("heading", { level: 2 }).className).toContain(
      "[font:var(--riprap-display-lg)]",
    );
  });
});

describe("FooterBand", () => {
  it("4-column links + the mono closing line 'dead on schedule'", () => {
    render(
      <FooterBand
        columns={[
          { heading: "pool", links: [{ href: "#a", label: "How it works" }] },
          { heading: "jury", links: [{ href: "#b", label: "Juror stake" }] },
          { heading: "docs", links: [{ href: "#c", label: "Policy" }] },
          { heading: "contact", links: [{ href: "#d", label: "Email" }] },
        ]}
        tagline="Event mutuals on Solana."
      />,
    );
    expect(screen.getAllByRole("navigation").length).toBe(4);
    const closing = screen.getByText("dead on schedule");
    expect(closing.className).toContain("font-mono");
    expect(screen.getByText("Event mutuals on Solana.")).toBeTruthy();
  });
});

describe("DissolutionBand — post-pool end state", () => {
  it("prints '$0 remaining' in mono on the deep ground", () => {
    const { container } = render(<DissolutionBand line="The pool is closed." remaining={0} />);
    const band = container.querySelector('[data-slot="dissolution-band"]') as HTMLElement;
    expect(band.className).toContain("bg-ground-deep");
    const remaining = screen.getByText("$0 remaining");
    expect(remaining.className).toContain("[font:var(--riprap-mono-number)]");
    expect(remaining.hasAttribute("data-num")).toBe(true);
    expect(screen.getByText("The pool is closed.")).toBeTruthy();
  });

  it("renders the scattered-mark slot", () => {
    render(
      <DissolutionBand line="closed" mark={<svg data-testid="scatter" viewBox="0 0 10 10" />} />,
    );
    expect(screen.getByTestId("scatter")).toBeTruthy();
  });
});

describe("SectionBand — the section-drawing grid primitive", () => {
  it("80px rhythm with a 1px closing rule", () => {
    const { container } = render(<SectionBand label="how it works">x</SectionBand>);
    const band = container.querySelector('[data-slot="section-band"]') as HTMLElement;
    expect(band.className).toContain("py-(--riprap-space-section)");
    expect(band.className).toContain("border-b");
    expect(band.className).toContain("border-hairline");
    expect(screen.getByRole("heading", { level: 2 }).className).toContain(
      "[font:var(--riprap-mono-label)]",
    );
  });

  it("alternates ground tones", () => {
    const { container } = render(<SectionBand tone="soft">x</SectionBand>);
    expect(container.querySelector('[data-slot="section-band"]')?.className).toContain(
      "bg-ground-soft",
    );
  });
});

describe("TextLink", () => {
  it("harbor-blue, hover shifts tone only", () => {
    render(<TextLink href="#">Read the policy</TextLink>);
    const link = screen.getByRole("link");
    expect(link.className).toContain("text-(--riprap-accent)");
    expect(link.className).toContain("hover:text-(--riprap-accent-hover)");
    expect(link.className).not.toMatch(/shadow-|hover:bg-/);
  });

  it("external links are safe: new tab + noopener + glyph", () => {
    render(
      <TextLink href="https://riprap.xyz" external>
        Policy
      </TextLink>,
    );
    const link = screen.getByRole("link");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
    expect(link.querySelector("svg")).toBeTruthy();
  });
});

describe("Container", () => {
  it("caps content at the 1200px column", () => {
    const { container } = render(<Container>x</Container>);
    expect(container.querySelector('[data-slot="container"]')?.className).toContain(
      "max-w-(--riprap-content-max)",
    );
  });
});
