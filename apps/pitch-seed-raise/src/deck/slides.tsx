import { ExpansionStrip, LifecycleStrip, Logomark, Wordmark } from "@riprap/ui";
import type { FC } from "react";

import { SlideFrame } from "./shell";
import { useSlideFrame } from "./useSlideFrame";

/**
 * The seed-raise deck — 10 slides, copy from meta/PITCH.md (the law for every
 * string and number below; citations ride along in mono). Golden-circle order:
 * WHY (the problem — the oldest fix has no on-ramp) → WHAT (the product) →
 * → the market (communities conventional economics skips) → the launch
 * (events are the door, Breakpoint first) → the business → the ask → the
 * vision → the team → close.
 *
 * Staging rules: headlines are lowercase (deck law); "insurance" never
 * describes our product (two directed exceptions: the vision slide names the
 * destination, 2026-09-15; the market slide names the conventional sector it
 * does not serve, 2026-09-16); every number carries its source; the team slide
 * is the accord deck's builder layout (copied 2026-09-15) on Riprap tokens.
 */

/** Rise style for frame-gated reveals: clamped progress in the
 * [start, start + dur] frame window, opacity + settle translate. */
const rise = (frame: number, start: number, dur = 18) => {
  const p = Math.min(1, Math.max(0, (frame - start) / dur));
  return { opacity: p, transform: `translateY(${(1 - p) * 10}px)` };
};

/* 01 — title ---------------------------------------------------------------- */

const TitleSlide: FC = () => {
  const frame = useSlideFrame();
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-12">
      <Logomark size={160} state="assemble" />
      <div data-rise className="flex flex-col items-center gap-6">
        <Wordmark size={84} className="tracking-(--riprap-tracking-mega)" />
        <div className="text-ink [font:var(--riprap-display-md)]">
          Peer-to-peer risk pooling on Solana.
        </div>
        <div
          className="mt-6 uppercase text-muted [font:var(--riprap-mono-label)] [letter-spacing:var(--riprap-tracking-stamp)]"
          style={rise(frame, 48)}
        >
          pre-seed raise · 2026
        </div>
      </div>
    </div>
  );
};

/* 02 — the problem ----------------------------------------------------------- */
/** The 2020–22 autopsy: one card per named failure, the error in three
 * words or fewer. Each maps to a structural fix in Hanse (one risk per
 * pool, staked jury, surplus to members) — the Q&A answer to "why has
 * nobody built this?" */
const MISTAKES: { name: string; error: string }[] = [
  { name: "Neptune Mutual", error: "upfront lump sum" },
  { name: "Cover Protocol", error: "exploited itself" },
  { name: "Solace", error: "shared idle pool" },
  { name: "OpenCover", error: "web3 portfolio cover" },
  { name: "Unslashed", error: "no float income" },
  { name: "InsurAce", error: "twenty thin chains" },
  { name: "Bridge Mutual", error: "farmed, not mutual" },
  { name: "Neptune Mutual", error: "token-vote claims" },
  { name: "Risk Harbor", error: "wLUNA collateral" },
];

/** The incumbents' four structural issues (PITCH.md §10, the Nexus et al.
 * row): every existing on-chain mutual shares them; none of them fixes them.
 * Each inverts into a product law on the next slide. */
const INCUMBENT_ISSUES = [
  {
    head: "token required",
    body: "governance-token ownership sits inside the operational path. joining, claiming, and exiting all route through the token.",
  },
  {
    head: "on-chain events only",
    body: "exploits, hacks, theft. if an oracle cannot read the event, the mutual cannot cover it.",
  },
  {
    head: "one pool for every risk",
    body: "a single shared treasury instead of one treasury per mutual. risks cross-subsidize, members cannot see their own money.",
  },
  {
    head: "none are permissionless",
    body: "no existing mutual lets a US corporation and a farmer in Bangladesh found one on the same rails.",
  },
];

const ProblemSlide: FC = () => {
  const frame = useSlideFrame();
  return (
    <SlideFrame kicker="the oldest fix in finance" headline="the problem">
      <div className="flex w-full flex-col gap-8">
        <div
          className="max-w-[62ch] text-ink [font:var(--riprap-title-md)]"
          style={rise(frame, 16)}
        >
          <p className="max-w-[80ch] text-2xl leading-snug text-body" style={rise(frame, 22)}>
            Mutual risk pools are the oldest form of pooled protection on earth.
            <br />
            Its members manage the payouts (Nexus Mutual, Lloyd's Evertas, Opencover, etc.).
          </p>
        </div>
      </div>
      <div className="flex w-full flex-col gap-3">
        <div className="flex items-baseline font-mono" style={rise(frame, 44)}>
          <span className="text-sm tracking-[0.2em] text-text-secondary">THE INCUMBENTS</span>
        </div>
        <div className="flex items-start gap-6">
          {INCUMBENT_ISSUES.map((issue, i) => (
            <div
              key={issue.head}
              className="flex flex-1 flex-col gap-2 border-t border-hairline pt-4"
              style={rise(frame, 56 + i * 12)}
            >
              <div className="text-ink [font:var(--riprap-title-sm)]">{issue.head}</div>
              <div className="text-muted [font:var(--riprap-body-sm)]">{issue.body}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex w-full flex-col gap-3 font-mono">
        <div className="flex items-baseline mt-6" style={rise(frame, 116)}>
          <span className="text-sm tracking-[0.2em] text-text-secondary">OTHER LIMITATIONS</span>
        </div>
        <div
          className="relative overflow-hidden py-1"
          style={{
            ...rise(frame, 136),
            maskImage: "linear-gradient(to right, transparent, black 4%, black 96%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent, black 4%, black 96%, transparent)",
          }}
        >
          <div className="mistakes-track flex w-max">
            {[0, 1].flatMap((copy) =>
              MISTAKES.map((m, i) => (
                <div
                  key={`${copy}-${i}`}
                  className="mr-4 flex shrink-0 flex-col gap-1 rounded-lg border border-white/10 px-6 py-4"
                >
                  <span className="text-sm text-text-secondary">{m.name}</span>
                  <span className="font-heading text-2xl font-bold tracking-tight text-nearwhite">
                    <span className="text-slash">✗ </span>
                    {m.error}
                  </span>
                </div>
              )),
            )}
          </div>
        </div>
      </div>
    </SlideFrame>
  );
};

/* 03 — the product ----------------------------------------------------------- */

const PRODUCT_LAWS = [
  {
    head: "written terms",
    body: "a hash-linked document provides the terms for the pool. build the basis for the pools purpose.",
  },
  {
    head: "members judge members",
    body: "claims adjudicate on-chain with staked jurors, sealed-then-revealed votes, bounded appeals, slashed incoherence.",
  },
  {
    head: "an enforced end, either way",
    body: "an expiring pool dissolves by clock; an open-ended one liquidates when its members choose.",
  },
];

const ProductSlide: FC = () => {
  const frame = useSlideFrame();
  return (
    <SlideFrame kicker="one mutual · one risk · a lifetime of its choosing" headline="the product">
      <div className="flex w-full flex-col gap-8">
        <div style={rise(frame, 16)}>
          <LifecycleStrip skipSteps={[5]} />
        </div>
        <div className="flex items-start gap-6">
          {PRODUCT_LAWS.map((l, i) => (
            <div
              key={l.head}
              className="flex flex-1 flex-col gap-2 border-t border-hairline pt-4"
              style={rise(frame, 40 + i * 14)}
            >
              <div className="text-ink [font:var(--riprap-title-sm)]">{l.head}</div>
              <div className="text-muted [font:var(--riprap-body-sm)]">{l.body}</div>
            </div>
          ))}
        </div>
      </div>
    </SlideFrame>
  );
};

/* 05 — the market ------------------------------------------------------------ */

/** The market story (rewritten 2026-09-16): not "insurance is a $1.6T
 * market" — the communities conventional insurance economics cannot serve.
 * Each "too" is the same fixed-cost wall from a different side; each inverts
 * into a pool the rails make possible. Numbers follow as evidence. */
const SKIPPED_COMMUNITIES = [
  {
    head: "too small",
    body: "a savings circle to start a small business. a sports club covering rent for one season.",
  },
  {
    head: "too geographically specific",
    body: "one bay's coastal homeowners. one valley's harvest failure.",
  },
  {
    head: "too short-duration",
    body: "a three-day conference. a fishing season. a tournament.",
  },
  {
    head: "too low-premium",
    body: "a one time $20 payment for a limited time cover",
  },
];

const EVIDENCE_ROWS = [
  { v: "$424B", label: "annual protection gap nobody covers", src: "Swiss Re sigma '25" },
  {
    v: "344M / 88%",
    label: "covered by microinsurance / of target still uncovered",
    src: "Micro Insurance Network '24",
  },
  {
    v: "~26¢",
    label: "of every US P&C premium dollar spent before a claim is paid",
    src: "Verisk/APCIA '25",
  },
  {
    v: "$1.61T",
    label: "mutual premiums a year — the behavior, already formalized",
    src: "ICMIF '24",
  },
];

const MarketSlide: FC = () => {
  const frame = useSlideFrame();
  return (
    <SlideFrame kicker="mutual risk pools" headline="the market">
      <div className="max-w-[76ch] text-body [font:var(--riprap-title-md)]" style={rise(frame, 12)}>
        Millions of communities don't fit conventional insurance economics.{" "}
        <span className="text-ink">
          We are building the infrastructure that lets those groups create their own risk pools.
        </span>
      </div>
      <div className="flex w-full items-start gap-6">
        {SKIPPED_COMMUNITIES.map((c, i) => (
          <div
            key={c.head}
            className="flex flex-1 flex-col gap-2 border-t border-hairline pt-4"
            style={rise(frame, 36 + i * 10)}
          >
            <div className="text-ink [font:var(--riprap-title-sm)]">{c.head}</div>
            <div className="text-muted [font:var(--riprap-body-sm)]">{c.body}</div>
          </div>
        ))}
      </div>
      <div className="flex w-full flex-col gap-4" data-num>
        <div className="flex items-baseline" style={rise(frame, 84)}>
          <span className="text-sm tracking-[0.2em] text-text-secondary">EVIDENCE</span>
        </div>
        {EVIDENCE_ROWS.map((r, i) => (
          <div
            key={r.label}
            className="flex items-baseline gap-8 border-t border-hairline pt-3"
            style={rise(frame, 92 + i * 12)}
          >
            <span className="w-[24ch] text-right text-accent [font:var(--riprap-mono-number)]">
              {r.v}
            </span>
            <span className="flex-1 text-ink [font:var(--riprap-title-sm)]">{r.label}</span>
            <span className="text-muted-soft [font:var(--riprap-mono-label)]">{r.src}</span>
          </div>
        ))}
      </div>
    </SlideFrame>
  );
};

/* 06 — the launch ------------------------------------------------------------ */

/** Why events, why Breakpoint first (PITCH.md §5/§8 + the 2026-09-15
 * additions: the Solana family's loyalty, sponsored covers). None of these
 * is market size — the market is slide 05's. */
const LAUNCH_REASONS = [
  {
    head: "the cleanest legal surface",
    body: "crypto-native members covering each other, one bounded window.",
  },
  {
    head: "the solana family is loyal",
    body: "breakpoint puts the whole ecosystem in one hall. the family adopts its own and talks about what ships.",
  },
  {
    head: "covers can be sponsored",
    body: "companies or regional superteams buy covers for their members — one buyer, a whole cohort, no per-member sale.",
  },
];

/** The pilot's terms — policy §5 (tiers) and §10 (worked example). One mono
 * size, aligned grid columns; numerals never float in body text (the old
 * mixed-size floating math was retired 2026-09-15). */
const PILOT_TIERS = [
  { name: "basic", entry: "$10", cap: "$1,000" },
  { name: "standard", entry: "$20", cap: "$2,000" },
  { name: "premium", entry: "$40", cap: "$4,000" },
];

const LaunchSlide: FC = () => {
  const frame = useSlideFrame();
  return (
    <SlideFrame kicker="events are the door" headline="the launch">
      <div
        className="max-w-[100ch] text-body [font:var(--riprap-title-md)]"
        style={rise(frame, 12)}
      >
        <span className="text-accent [font:var(--riprap-mono-number)]">
          Blade Pool @ Breakpoint 2026:
        </span>
        a knife-assault mutual for conference attendees, run in front of the entire Solana
        ecosystem.
      </div>
      <div className="flex w-full items-start gap-10">
        <div className="flex flex-1 flex-col gap-5">
          {LAUNCH_REASONS.map((r, i) => (
            <div key={r.head} className="flex flex-col gap-1" style={rise(frame, 24 + i * 12)}>
              <div className="text-ink [font:var(--riprap-title-sm)]">{r.head}</div>
              <div className="text-muted [font:var(--riprap-body-sm)]">{r.body}</div>
            </div>
          ))}
        </div>
        <div
          className="flex w-[46ch] flex-col gap-3 border border-hairline bg-(--riprap-surface-card) p-7"
          style={rise(frame, 48)}
          data-num
        >
          <div className="text-muted [font:var(--riprap-mono-label)]">
            Olympia, London · 15–17 November 2026 · 8,000+ attendees
          </div>
          <div className="flex flex-col gap-1.5 border-t border-hairline pt-4">
            <div className="uppercase text-muted-soft [font:var(--riprap-mono-label)] [letter-spacing:var(--riprap-tracking-stamp)]">
              tiers — entry → payout cap
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-baseline gap-x-8 gap-y-1.5">
              {PILOT_TIERS.flatMap((t) => [
                <span key={t.name} className="text-body [font:var(--riprap-body-sm)]">
                  {t.name}
                </span>,
                <span
                  key={`${t.name}-entry`}
                  className="text-right text-accent [font:var(--riprap-mono-number)]"
                >
                  {t.entry}
                </span>,
                <span
                  key={`${t.name}-cap`}
                  className="text-right text-accent [font:var(--riprap-mono-number)]"
                >
                  {t.cap}
                </span>,
              ])}
            </div>
          </div>
          {/*
          <div className="flex flex-col gap-1.5 border-t border-hairline pt-4">
            <div className="uppercase text-muted-soft [font:var(--riprap-mono-label)] [letter-spacing:var(--riprap-tracking-stamp)]">
              worked example — standard tier
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-8 gap-y-1.5">
              {PILOT_MATH.map((m) => [
                <span key={m.label} className="text-body [font:var(--riprap-body-sm)]">
                  {m.label}
                </span>,
                <span
                  key={`${m.label}-value`}
                  className="text-right text-accent [font:var(--riprap-mono-number)]"
                >
                  {m.v}
                </span>,
              ])}
            </div>
            <div className="pt-1 text-muted [font:var(--riprap-body-sm)]">
              quiet event: every cent returns, then the pool dissolves
            </div>
          </div>
 */}
        </div>
      </div>
    </SlideFrame>
  );
};

/* 07 — the business ---------------------------------------------------------- */

const BUSINESS_LADDER = [
  { v: "0%", label: "protocol take on pool #1, the pilot exists to confirm the market" },
  {
    v: "% of surplus",
    label:
      "take-rate, switched on with the subsequent pools, doubles as the organizer revenue-share",
  },
  {
    v: "operating fees",
    label: "running flagship pools for sponsors who want the product but not the ops",
  },
  {
    v: "other options",
    label: "The correct monetization should emerge from usage.",
  },
];

const BusinessSlide: FC = () => {
  const frame = useSlideFrame();
  return (
    <SlideFrame kicker="revenue first" headline="the business">
      <div className="flex w-full flex-col gap-8">
        <div className="flex flex-col gap-4" data-num>
          {BUSINESS_LADDER.map((r, i) => (
            <div
              key={r.v}
              className="flex items-baseline gap-8 border-t border-hairline pt-4"
              style={rise(frame, 24 + i * 16)}
            >
              <span className="w-[18ch] text-right text-accent [font:var(--riprap-mono-number)]">
                {r.v}
              </span>
              <span className="flex-1 text-ink [font:var(--riprap-title-sm)]">{r.label}</span>
            </div>
          ))}
        </div>
        <div
          className="flex flex-col gap-2 text-muted [font:var(--riprap-body-sm)]"
          style={rise(frame, 100)}
        >
          <div>USDC end to end. No product token required.</div>
        </div>
      </div>
    </SlideFrame>
  );
};

/* 08 — the ask --------------------------------------------------------------- */

const ASK_TERMS = [
  { v: "$700k", sub: "raise · range $600–800k" },
  { v: "SAFE + warrant", sub: "post-money · token warrant, bounded and defined pre-open" },
  { v: "$7M post", sub: "opening cap · 10% dilution" },
  { v: "18 months", sub: "runway · primary milestone: organizer-initiated pools" },
];

const UNLOCK_STEPS = [
  "security — audit the arbitration layer and the pool/hanse programs",
  "product — hanse orchestrator → SDK → end-to-end suite",
  "proof — the Blade Pool pilot, results published",
  "legal — the structure for broader membership",
  "growth — convert pilot traction into organizer-initiated pools",
];

const AskSlide: FC = () => {
  const frame = useSlideFrame();
  return (
    <SlideFrame kicker="pre-seed" headline="the ask">
      <div className="flex w-full items-start gap-10" data-num>
        <div className="flex flex-1 flex-col gap-6">
          {ASK_TERMS.map((t, i) => (
            <div key={t.v} className="flex flex-col gap-1" style={rise(frame, 20 + i * 14)}>
              <span className="text-accent [font:var(--riprap-mono-number-lg)]">{t.v}</span>
              <span className="text-muted [font:var(--riprap-mono-label)]">{t.sub}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-1 flex-col gap-3" style={rise(frame, 60)}>
          <div className="uppercase text-muted-soft [font:var(--riprap-mono-label)] [letter-spacing:var(--riprap-tracking-stamp)]">
            capital → de-risk → prove → unlock organizer-initiated pools
          </div>
          {UNLOCK_STEPS.map((s) => (
            <div
              key={s}
              className="border-t border-hairline pt-3 text-ink [font:var(--riprap-body-sm)]"
            >
              {s}
            </div>
          ))}
          <div className="mt-3 text-muted [font:var(--riprap-body-sm)]">
            What $100k gets you to: not 18 months — from an audited working product and an
            operational pilot to a repeatable network of organizer-initiated pools.
          </div>
        </div>
      </div>
    </SlideFrame>
  );
};

/* 09 — the vision (mutuals as a protocol — the directed "insurance" slide) --- */

/** The vision, enumerated like the ExpansionStrip below it — one added
 * thing per step, ordinals matching the plates (n ↔ tile step). The pool
 * itself never changes shape; only what surrounds it grows. Copy per
 * meta/PITCH.md §12 (destination vocabulary; this slide's directed
 * exception to the vocabulary law is the headline sentence only). */
const VISION_STEPS = [
  {
    n: "01",
    head: "one pool",
    body: (
      <>
        where it starts: single risk, one treasury, a bounded lifetime. the{" "}
        <span className="font-extrabold text-white/80">blade pool</span> pilot
      </>
    ),
  },
  {
    n: "02",
    head: "anyone founds one",
    body: (
      <>
        a mutual is a transaction and can carry any risk, any terms, any group and use the same
        <span className="font-extrabold text-white/80"> shared contract</span>.
      </>
    ),
  },
  {
    n: "03",
    head: "cover renews",
    body: (
      <>
        contributions recur through the pull payments rail. We've alreday built that with{" "}
        <span className="font-extrabold text-white/80"> tributary.so</span>.
      </>
    ),
  },
  {
    n: "04",
    head: "a backstop grows",
    body: (
      <>
        <span className="font-extrabold text-white/80">external risk capital</span> stakes a reserve
        beneath the pool and earns a rule-set share of its surplus.
      </>
    ),
  },
  {
    n: "05",
    head: "pools cover pools",
    body: (
      <>
        mutuals cover each other: first loss below, the tail above.{" "}
        <span className="font-extrabold text-white/80">reinsurance and tranching</span>.
      </>
    ),
  },
];

/** The vision slide is the deck's one directed exception to the vocabulary
 * law: "insurance" appears here and only here, naming the destination the
 * protocol points at — never the product sold today (meta/PITCH.md §0/§12). */
const VisionSlide: FC = () => {
  const frame = useSlideFrame();
  return (
    <SlideFrame kicker="mutuals are the destination" headline="the vision">
      <div className="flex w-full flex-col gap-8">
        <div
          className="max-w-[62ch] text-ink [font:var(--riprap-title-md)]"
          style={rise(frame, 16)}
        >
          An open protocol for truly peer-to-peer, permissionless insurance, on chain.
        </div>

        <div style={rise(frame, 32)}>
          <ExpansionStrip />
        </div>

        {/* same grid template as the strip — column i elaborates plate i */}
        <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {VISION_STEPS.map((s, i) => (
            <div
              key={s.n}
              className="flex flex-col gap-2 border-t border-hairline pt-4"
              style={rise(frame, 52 + i * 12)}
            >
              <div className="flex items-baseline gap-2">
                <span data-num className="text-muted-soft [font:var(--riprap-mono-label)]">
                  {s.n}
                </span>
                <span className="text-ink [font:var(--riprap-title-sm)]">{s.head}</span>
              </div>
              <div className="text-muted [font:var(--riprap-body-sm)]">{s.body}</div>
            </div>
          ))}
        </div>
      </div>
    </SlideFrame>
  );
};

/* 10 — the team (layout copied from the accord deck's builder slide) --------- */

const FABIAN_ROWS = [
  "Dr.-Ing., engineering",
  "full-time crypto since 2014",
  "first hire paid by a blockchain, ever",
  "BitShares escrow & treasury — built",
  "fabian@die-schuhs.de · x.com/@xeroc",
];

const CORINNA_ROWS = [
  "fact ferret",
  "the unrelenting",
  "number cruncher",
  "devils advocate",
  "on shift 24/7",
];

const PERSONAS: { img: string; alt: string; caption: string; rows: string[] }[] = [
  {
    img: "fabian.webp",
    alt: "Dr.-Ing. Fabian Schuh",
    caption: "Dr.-Ing. Fabian Schuh · founder",
    rows: FABIAN_ROWS,
  },
  {
    img: "corinna.webp",
    alt: "Corinna — ai agent",
    caption: "Corinna · ai agent",
    rows: CORINNA_ROWS,
  },
];

/** The achievement wall — ambience, not a reading list. Two copies make the
 * marquee seamless; the audience catches fragments, that's the point. */
const KUDOS = [
  "Accord — on-chain arbitration · live",
  "2× Gold · Colosseum Frontier 2026",
  "Tributary — Solana payment rail · mainnet",
  "Solana Foundation grant · 2026",
  "Riprap — pool program · built",
  "500M+ blocks produced",
  "first hire by a blockchain, ever",
  "Canon — curated-list registry on Accord",
  "Synod — N-party escrow on Accord",
  "BitShares escrow & worker treasury",
  "python-bitshares — full L1 SDK",
  "Solana Security #2 graduate",
  "Cypherpunk · $10k · 2025",
  "Superteam Germany grant · 2024",
  "Advisor to MakerDAO",
  "graphenelib — SDK for a chain family",
  "committee seats: Steem/Hive/BTS",
  "exits: Steemit · Streemian · Cryptonomex",
  "RADAR · honorable mention · 2024",
  "repo.trade — launchpad for repos",
  "chaoscraft — 1,000 minds, 1 codebase",
  "committee · Graphene Foundation",
];

const TeamSlide: FC = () => {
  const frame = useSlideFrame();
  return (
    <div className="relative h-full w-full">
      <div className="flex h-full flex-col justify-center gap-10 pl-[7cqw] pr-[30cqw]">
        <div className="flex flex-col gap-5">
          <div className="uppercase text-accent [font:var(--riprap-mono-label)] [letter-spacing:var(--riprap-tracking-stamp)]">
            the builders
          </div>
          <h2 className="max-w-[24ch] text-ink [font:var(--riprap-display-xl)] [letter-spacing:var(--riprap-tracking-display)]">
            the team
          </h2>
        </div>
        <div className="flex items-start gap-20">
          {PERSONAS.map((p, pi) => (
            <figure key={p.img} className="flex flex-col gap-4" style={rise(frame, 24 + pi * 40)}>
              <img
                src={p.img}
                alt={p.alt}
                className="h-[28cqh] w-auto border border-hairline object-cover"
              />
              <figcaption className="text-muted [font:var(--riprap-mono-label)]">
                {p.caption}
              </figcaption>
              <div className="flex flex-col gap-2.5 pt-1">
                {p.rows.map((r, i) => (
                  <div
                    key={r}
                    className="text-body [font:var(--riprap-body-sm)]"
                    style={rise(frame, 56 + pi * 40 + i * 8)}
                  >
                    <span className="text-accent">▶</span> {r}
                  </div>
                ))}
              </div>
            </figure>
          ))}
        </div>
      </div>
      <div
        className="absolute inset-y-0 right-0 flex w-[50ch] items-center overflow-hidden font-mono"
        style={{
          maskImage: "linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)",
          ...rise(frame, 56),
        }}
      >
        <div className="kudos-track flex w-full flex-col">
          {[0, 1].flatMap((copy) =>
            KUDOS.map((k) => (
              <div
                key={`${copy}-${k}`}
                className="w-full whitespace-nowrap py-2 pr-4 text-right text-sm leading-relaxed text-muted-soft"
              >
                {k}
              </div>
            )),
          )}
        </div>
      </div>
    </div>
  );
};

/* 11 — close ------------------------------------------------------------------ */

const LINKS = [
  { url: "riprap.xyz", note: "the platform" },
  { url: "useaccord.xyz", note: "the arbitration layer" },
  { url: "@riprapxyz", note: "the build log" },
];

const CloseSlide: FC = () => {
  const frame = useSlideFrame();
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-12 px-[7cqw] text-center">
      <div className="flex flex-col items-center gap-5" style={rise(frame, 0)}>
        <Wordmark size={64} />
        <div
          className="h-px w-56 bg-accent"
          style={{ opacity: Math.min(1, Math.max(0, (frame - 20) / 24)) }}
        />
      </div>
      <div data-rise className="flex flex-wrap justify-center gap-12">
        {LINKS.map((l, i) => (
          <span
            key={l.url}
            className="flex flex-col items-center gap-1"
            style={rise(frame, 40 + i * 16)}
          >
            <span className="text-ink [font:var(--riprap-mono-number)]">{l.url}</span>
            <span className="text-muted [font:var(--riprap-mono-label)]">{l.note}</span>
          </span>
        ))}
      </div>
      <div className="text-ink [font:var(--riprap-display-lg)]" style={rise(frame, 104)}>
        Pool risk peer-to-peer.
      </div>
    </div>
  );
};

/* ---- registry ---------------------------------------------------------------- */

export interface SlideDef {
  id: string;
  label: string;
  notes: string;
  component: FC;
}

export const SLIDES: SlideDef[] = [
  {
    id: "title",
    label: "riprap",
    notes:
      "10s. Riprap — peer-to-peer risk pooling on Solana. Status honesty: pool program built, arbitration live on devnet, the event-mutual orchestrator (hanse) in build, payment rail live on mainnet. Pre-Seed raise, 2026.",
    component: TitleSlide,
  },
  {
    id: "problem",
    label: "the problem",
    notes:
      "40s. Mutual protection is the oldest fix — farmers, fishers, shipowners, savings groups, gig workers, clubs. The formal version is $1.61T and winning (ICMIF '24). The informal version dies of opacity, disputes, and scale — which is exactly why the friendly societies became licensed mutuals: formalization fixed trust at the price of the charter. The on-chain incumbents — Nexus et al. — carry four structural issues: a governance token wired into the operational hot path, cover for on-chain events only, one shared pool where each mutual should hold its own treasury, and permissioned entry end to end — none of them lets a US corporation and a Bangladeshi farmer found one on the same rails. The 2020–22 graveyard scrolling below is the same lesson at company scale. Today the choice is a WhatsApp group with a cash box or a decade of licensing. Land: the behavior is universal, the on-ramp does not exist.",
    component: ProblemSlide,
  },
  {
    id: "product",
    label: "the product",
    notes:
      "35s. One mutual, one risk, a lifetime of its choosing — event pools expire by clock; open-ended mutuals liquidate when members choose. Walk the lifecycle strip: join, gather, rule, claim. Three laws: two exit doors (no discretionary signer); members judge members (Accord — useaccord.xyz — staked jurors, sealed votes, appeals, slashing); an enforced end either way. Status row verbatim if asked: pool built, arbitration on devnet, hanse in build, Tributary on mainnet. Audits gate mainnet capital — that is what the raise funds first.",
    component: ProductSlide,
  },
  {
    id: "launch",
    label: "the launch",
    notes:
      "35s. Events are the door — five reasons, none of them market size: the cleanest legal surface (discretionary mutual, crypto-native members, bounded window — no counsel spend at pilot scale); funds locked up briefly (a pool lives for the event window, then pays approved claims, returns the rest, dissolves — numbers published either way); the Solana family is loyal (Breakpoint concentrates the ecosystem in one hall — the space adopts its own and talks about what ships, so the pilot's first audience is the space itself); the organizer is a B2B2C channel — one sale brings the attendee list; covers can be sponsored — companies or regional superteams buying for their members. The pilot itself: Blade Pool at Breakpoint, Olympia London, 15–17 Nov 2026, 8,000+ attendees (solana.com/breakpoint); tiers $10/$20/$40 capped at $1k/$2k/$4k (policy §5); worked example (policy §10): 1,000 × $20 → $20,000 pooled; 4 approved claims × $2,000 → $8,000 paid; $12,000 returned → $12 back each; quiet event: every cent returns. Then the 2027 circuit — the PMF signal and the primary milestone: organizer-initiated pools, an organizer who shows up without us.",
    component: LaunchSlide,
  },
  {
    id: "business",
    label: "the business",
    notes:
      "25s. Revenue-first ladder: 0% take on the pilot (it exists to publish numbers); take-rate on surplus switched on with the second pool — doubles as the organizer revenue-share; operator fees for flagship deployments; at the destination, a rail share on mutuals we do not operate. USDC end to end, no product token. The raise carries a token warrant over staked reserve capital — protection yield — bounded to a fixed share of any future supply with terms published before the round opens; the preferred end state is token-only via MetaDAO — value to the DAO, not the cap table. The warrant is the term we negotiate hardest.",
    component: BusinessSlide,
  },
  {
    id: "market",
    label: "the market",
    notes:
      "35s. The story first, then the numbers: millions of communities are too small, too geographically specific, too short-duration, or too low-premium for conventional insurance economics — a $20, 3-day, single-peril cover is sub-economic by construction when ~26¢ of every US P&C premium dollar is spent before a claim is paid (Verisk/APCIA '25). We are building the infrastructure that lets those groups create their own risk pools. Then read the evidence, do not editorialize: $424B protection gap (Swiss Re '25); 344M covered, 88% uncovered (MiN '24); ~26¢ per premium dollar (Verisk '25); $1.61T mutual premiums — the same behavior, formalized (ICMIF '24). If asked: $136B alternative capital gated at $200k QIB tickets (Aon '25); on-chain, $3.4B stolen per year against a $104M cover sector (Chainalysis, DeFiLlama); market scan — Nexus Mutual $5.7M cover fees '25, $2.7M raised ever, $1B+ purchased; OpenCover $4.6M seed '22–23, $141.6M protected '25. Close: one machine addresses every row — a mutual becomes a transaction, surplus returns by rule, the back office is the chain.",
    component: MarketSlide,
  },
  {
    id: "ask",
    label: "the ask",
    notes:
      "30s. $700k on a post-money SAFE plus a bounded token warrant; range $600–800k; opening cap $7M post — 10%; 18 months; primary milestone organizer-initiated pools. The narrative: capital → de-risk → prove → unlock — security, product, proof, legal, growth. If asked what $100k gets an angel to: from an audited working product and an operational pilot to a repeatable network of organizer-initiated pools. Angel-ladder construction stays private.",
    component: AskSlide,
  },
  {
    id: "vision",
    label: "the vision",
    notes:
      "30s. Zoom out before the team: the pilot is the proof, not the product. The destination is mutuals as an open protocol on Solana — true peer-to-peer, permissionless insurance, on-chain. This is the one slide that says the word: it names where the machine goes, not what we sell today — everywhere else the vocabulary law holds, and the licensed perimeter is entered deliberately, with carriers, where it requires it. Walk the strip, one added thing per step, the pool itself never changing shape: 01 one pool — the pilot's shape, the proof everything grows from; 02 anyone founds one — a mutual is a transaction, not a company formation; 03 cover renews — recurring contributions on the payment rail, live on mainnet today; 04 a backstop grows — external risk capital staking the reserve for a rule-set share of surplus; 05 pools cover pools — first loss below, tail above: reinsurance and tranching as protocol properties. The machines already exist — payment rail live on mainnet, arbitration live on devnet, pool program built. The stack is the destination. Segue: who builds it — next slide.",
    component: VisionSlide,
  },
  {
    id: "team",
    label: "the team",
    notes:
      "20s. Who builds this — the human and the AI teammate. Left: Dr.-Ing. Fabian Schuh — full-time crypto since 2014, first person hired and paid directly by a blockchain, built the BitShares escrow and worker-proposal treasury, Solana Security #2. Right: Corinna — BD, social, analytics, on shift 24/7. The scrolling wall is ambience — twenty years of shipping, on-chain since 2014. Gesture once, don't read it.",
    component: TeamSlide,
  },
  {
    id: "close",
    label: "pool risk peer-to-peer",
    notes:
      "10s. The surfaces — riprap.xyz, useaccord.xyz (the arbitration layer), the repo, the build log. Hold on the tagline: pool risk peer-to-peer. Conversations after.",
    component: CloseSlide,
  },
];
