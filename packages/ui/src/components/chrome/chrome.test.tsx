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
import { ProblemSolutionCard } from "./ProblemSolutionCard";
import { SectionBand } from "./SectionBand";
import { StampBadge } from "./StampBadge";
import { TextLink } from "./TextLink";
import { TierCard } from "./TierCard";
import { TopNav } from "./TopNav";
import { TweetCard } from "./TweetCard";
import { WorkedExampleReceipt } from "./WorkedExampleReceipt";

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

const LINES = [
  { value: "1,000", caption: "members" },
  { value: "× $20", caption: "entry (Standard)" },
  { value: "$20,000", caption: "pool" },
];
const TOTAL = { value: "$12,000", caption: "remains" };

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

describe("ProblemSolutionCard — problem above, solution emphasized below", () => {
  const CARD = {
    index: "05",
    question: "Surplus take-rate yields zero revenue at 0% loss.",
    answer: "Charge on flow, not surplus: take on entry survives every loss ratio.",
  };

  it("renders verbatim question and answer with both band stamps", () => {
    render(<ProblemSolutionCard {...CARD} />);
    expect(screen.getByText(/Surplus take-rate/)).toBeTruthy();
    expect(screen.getByText(/Charge on flow/)).toBeTruthy();
    expect(screen.getByText("problem")).toBeTruthy();
    expect(screen.getByText("solution")).toBeTruthy();
  });

  it("splits the bands: problem on card ground, solution on the plate tone step", () => {
    const { container } = render(<ProblemSolutionCard {...CARD} />);
    const problem = container.querySelector('[data-slot="ps-problem"]');
    const solution = container.querySelector('[data-slot="ps-solution"]');
    expect(problem?.className).not.toContain("bg-strong");
    expect(solution?.className).toContain("bg-strong");
    expect(solution?.className).toContain("border-t");
    expect(solution?.className).toContain("border-hairline");
  });

  it("numerals render mono (data-num), including the ordinal", () => {
    const { container } = render(<ProblemSolutionCard {...CARD} />);
    const numerals = container.querySelectorAll("[data-num]");
    expect(numerals[0].textContent).toBe("05");
    // the ordinal stamps mono via --riprap-mono-label; prose numerals via font-mono
    expect(numerals[0].className).toContain("[font:var(--riprap-mono-label)]");
    expect(numerals[1].className).toContain("font-mono");
  });
});

describe("WorkedExampleReceipt — a bill, one line at a time", () => {
  it("staggered arrival in prop order, lines then total, 40ms apart (--riprap-stagger)", () => {
    render(<WorkedExampleReceipt lines={LINES} total={TOTAL} />);
    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(3);
    const total = screen.getByText("$12,000").closest("[data-total]");

    // before the receipt scrolls into view: nothing arrived
    expect(rows[0].getAttribute("data-arrived")).toBe("false");
    expect(total?.getAttribute("data-arrived")).toBe("false");

    // the receipt enters the viewport → arrival timers start
    act(() => observers[observers.length - 1].fire(true));
    expect(rows[0].getAttribute("data-arrived")).toBe("false");

    act(() => vi.advanceTimersByTime(1)); // t=1ms: line 1 settled
    expect(rows[0].getAttribute("data-arrived")).toBe("true");
    expect(rows[1].getAttribute("data-arrived")).toBe("false");

    act(() => vi.advanceTimersByTime(38)); // t=39ms: still only line 1
    expect(rows[1].getAttribute("data-arrived")).toBe("false");

    act(() => vi.advanceTimersByTime(1)); // t=40ms: line 2 settles
    expect(rows[1].getAttribute("data-arrived")).toBe("true");
    expect(rows[2].getAttribute("data-arrived")).toBe("false");

    act(() => vi.advanceTimersByTime(80)); // t=120ms: lines 3 + total settled
    expect(rows[2].getAttribute("data-arrived")).toBe("true");
    expect(total?.getAttribute("data-arrived")).toBe("true");
  });

  it("renders every line and the total statically under prefers-reduced-motion", () => {
    reducedMotion = true;
    try {
      render(<WorkedExampleReceipt lines={LINES} total={TOTAL} />);
      const rows = screen.getAllByRole("listitem");
      for (const item of [...rows, screen.getByText("$12,000").closest("[data-total]")]) {
        expect(item?.getAttribute("data-arrived")).toBe("true");
        expect(item?.className).not.toContain("opacity-0");
      }
    } finally {
      reducedMotion = false;
    }
  });

  it("tabular line rows: caption left, value right in mono; total set off under a hairline rule", () => {
    render(<WorkedExampleReceipt lines={LINES} total={TOTAL} />);
    act(() => observers[observers.length - 1].fire(true));
    vi.advanceTimersByTime(200);

    const first = screen.getByText("1,000").closest("li");
    expect(first?.className).toContain("flex");
    expect(first?.querySelector("span")?.textContent).toBe("members");
    expect(first?.hasAttribute("data-num")).toBe(true);

    const value = first?.lastElementChild; // caption · leader · value
    expect(value?.className).toContain("[font:var(--riprap-mono-number)]");

    const total = screen.getByText("$12,000").closest("[data-total]");
    expect(total?.className).toContain("border-t");
    expect(total?.className).toContain("border-hairline");
    expect(total?.lastElementChild?.className).toContain("[font:var(--riprap-mono-number-lg)]");
  });
});

describe("TweetCard — quoted evidence, verbatim", () => {
  const TWEET = {
    author: "bunjil",
    handle: "bunjil",
    text: "at london breakpoint 😃🤙\n\ngetting stabbed 😱🔪\n\nat 1 billion TPS 🤯🚀",
    date: "Dec 12, 2025",
  };

  it("renders the quote verbatim with author, handle and date stamp", () => {
    render(<TweetCard {...TWEET} />);
    expect(screen.getByText("@bunjil")).toBeTruthy();
    expect(screen.getByText("Dec 12, 2025")).toBeTruthy();
    // multiline text keeps its line breaks
    const quote = screen.getByText(/getting stabbed/i);
    expect(quote.className).toContain("whitespace-pre-line");
  });

  it("truncates past maxChars with an ellipsis, never edits short quotes", () => {
    const long = "a".repeat(100);
    const { rerender } = render(<TweetCard {...TWEET} text={long} maxChars={90} />);
    expect(screen.getByText(/^a{90}…$/)).toBeTruthy();
    rerender(<TweetCard {...TWEET} text="short" />);
    expect(screen.getByText("short")).toBeTruthy();
  });

  it("paper slip on the dark board: data-mode=paper, hairline, sharp corners", () => {
    render(<TweetCard {...TWEET} />);
    const card = screen.getByText("@bunjil").closest('[data-slot="tweet-card"]');
    expect(card?.getAttribute("data-mode")).toBe("paper");
    expect(card?.className).toContain("border-hairline");
    expect(card?.className).toContain("rounded-none");
    expect(card?.className).not.toContain("rounded-2xl");
    // no avatar → the square initials tile
    const tile = card?.querySelector("span[aria-hidden='true']");
    expect(tile?.className).toContain("rounded-none");
    expect(tile?.textContent).toBe("B"); // initials of "bunjil" (one word)
  });

  it("the author's real avatar is the disc — the one sanctioned circle", () => {
    render(<TweetCard {...TWEET} avatar="/avatars/bunjil.jpg" />);
    const img = screen.getByAltText("avatar of bunjil");
    expect(img.getAttribute("src")).toBe("/avatars/bunjil.jpg");
    expect(img.className).toContain("rounded-full");
    expect(img.className).toContain("object-cover");
  });

  it("handle and date are mono (numerals/stamps); quote body is grotesk", () => {
    render(<TweetCard {...TWEET} />);
    expect(screen.getByText("@bunjil").className).toContain("[font:var(--riprap-mono-label)]");
    expect(screen.getByText("Dec 12, 2025").className).toContain("[font:var(--riprap-mono-label)]");
    const quote = screen.getByText(/getting stabbed/i);
    expect(quote.className).toContain("[font:var(--riprap-body-sm)]");
  });

  it("renders as a link to the source tweet when href is given", () => {
    render(<TweetCard {...TWEET} href="https://x.com/bunjil/status/1999412271404187937" />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("https://x.com/bunjil/status/1999412271404187937");
    expect(link.getAttribute("target")).toBe("_blank");
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
