import {
  Backstop,
  Claim,
  ExpansionTile,
  Gather,
  Join,
  Logomark,
  Renew,
  Rule,
  Stack,
  Wordmark,
} from "@riprap/ui";
import type { FC, ReactNode } from "react";

import { SlideFrame } from "./shell";
import { useSlideFrame } from "./useSlideFrame";

/**
 * The seed-raise deck — 10 slides + appendix, copy from meta/PITCH.md (the
 * law for every string and number below; citations ride along in mono — the
 * 2026-09-17 headline re-stage and the 2026-09-18 vision/problem re-stages
 * below are not yet mirrored there). The destination leads: the vision right
 * after the title — why the world is ripe for internet insurance (smart
 * well-understood business logic on 24/7/365 rails; the tradinsure/web3
 * comparison table) — then the walk back down to today — the problem → the
 * product → the pilot (events are the door, Breakpoint first) → the business
 * → the market → the ask → the team → close → the appendix (the five-machine
 * destination stack the vision slide carried before the re-stage).
 *
 * Staging rules (re-staged 2026-09-17): the kicker names the slide; the
 * headline carries the statement. "insurance" appears in headlines by
 * authorial call — the vision names the destination, the product the rails,
 * business/market the conventional economics; every number carries its
 * source; the team slide is the accord deck's builder layout (copied
 * 2026-09-15) on Riprap tokens.
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
          Real-World Risk Protection on Solana.
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

/* 02 — the vision (why internet insurance, why now) ------------------------ */

/** The ripeness argument (re-staged 2026-09-18; not yet mirrored in
 * meta/PITCH.md): call a smart contract what it is — business logic on
 * 24/7/365 rails. Defi trading already proved the pattern for
 * well-understood business logic; insurance is the same shape of business.
 * The comparison table lands it: both worlds do the two core jobs, only one
 * has the rail properties. The five-machine destination strip this slide
 * carried before the re-stage lives on in the appendix below. */
const COMPARE_COLS = ["traditional insurance", "web3 insurance"] as const;

/** One cell mark — a check or a cross, mono, nothing else in the cell. */
const Mark: FC<{ yes: boolean }> = ({ yes }) => (
  <span data-num className={`${yes ? "text-accent" : "text-muted-soft"} text-3xl`}>
    {yes ? "✓" : "✗"}
  </span>
);

/** ✓ = supported, ✗ = not. The first two rows are the business — both
 * worlds do them; the rest are the rails — only the web3 column has them. */
const COMPARE_ROWS: { id: string; label: ReactNode; trad: boolean; web3: boolean }[] = [
  { id: "pool-money", label: "pool money", trad: true, web3: true },
  { id: "decide-payouts", label: "decide payouts", trad: true, web3: true },
  { id: "transparent", label: "transparent", trad: false, web3: true },
  { id: "fast", label: "fast", trad: false, web3: true },
  {
    id: "global",
    label: (
      <>
        global &{" "}
        <span data-num className="font-mono">
          24/7/365
        </span>
      </>
    ),
    trad: false,
    web3: true,
  },
  { id: "permissionless", label: "permissionless", trad: false, web3: true },
  { id: "composable", label: "composable", trad: false, web3: true },
];

const VisionSlide: FC = () => {
  const frame = useSlideFrame();
  return (
    <SlideFrame kicker="the vision" headline="Internet Insurance">
      <div className="flex w-full flex-col gap-8">
        {/* the comparison table — same business, different rails */}
        <div className="flex w-full flex-col">
          <div className="grid grid-cols-[minmax(0,1fr)_20ch_20ch] items-baseline pb-1">
            <span />
            {COMPARE_COLS.map((col) => (
              <span
                key={col}
                className="text-center uppercase text-muted [font:var(--riprap-mono-label)] [letter-spacing:var(--riprap-tracking-stamp)]"
              >
                {col}
              </span>
            ))}
          </div>
          {COMPARE_ROWS.map((r, i) => (
            <div
              key={r.id}
              className="grid grid-cols-[minmax(0,1fr)_20ch_20ch] items-center border-t border-hairline py-2"
              style={rise(frame, 4 + i * 8)}
            >
              <span className="text-ink [font:var(--riprap-title-sm)]">{r.label}</span>
              <span className="text-center">
                <Mark yes={r.trad} />
              </span>
              <span className="text-center">
                <Mark yes={r.web3} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </SlideFrame>
  );
};

/* 03 — the problem ----------------------------------------------------------- */

/** The monolith re-staged (2026-09-18 off
 * meta/marketing/07-brand-assets/why-on-chain.md; not yet mirrored in
 * meta/PITCH.md): one number carried very large — ~26¢ of every premium
 * dollar spent before a claim is paid — its meaning set beside it, source
 * riding along in mono. The solvency and jurisdiction rows were retired in
 * the same re-stage; the vision table still carries those ✗. */

/** The 2020–22 autopsy: one chip per named failure, the error in three
 * words or fewer. Each maps to a structural fix in Hanse (one risk per
 * pool, staked jury, surplus to members) — the Q&A answer to "why has
 * nobody built this?" */
const MISTAKES: { name: string; error: string }[] = [
  {
    name: "",
    error: "governance token required",
  },
  { name: "", error: "on-chain events only" },
  { name: "", error: "one pool for every risk" },
  { name: "", error: "none are permissionless" },
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

const ProblemSlide: FC = () => {
  const frame = useSlideFrame();
  return (
    <SlideFrame kicker="the problem" headline="Insurance is a slow, expensive monolith.">
      <div className="flex w-full flex-col gap-12">
        {/* the number, very big; what it means beside it */}
        <div className="flex items-center gap-12">
          <span
            data-num
            className="text-accent font-mono text-[12rem] leading-none font-semibold tracking-(--riprap-tracking-display)"
            style={rise(frame, 8)}
          >
            ~26¢
          </span>
          <span className="flex max-w-[42ch] flex-col gap-3" style={rise(frame, 24)}>
            <span className="text-ink [font:var(--riprap-display-sm)]">
              of every premium dollar is spent before a claim is paid.
            </span>
            <ol className="list-disc ml-6">
              <li>and it still takes 30 to 60 days on average</li>
              <li>microinsurances often infeasible</li>
            </ol>
            <span className="text-muted-soft [font:var(--riprap-mono-label)]">
              Verisk/APCIA '25
            </span>
          </span>
        </div>

        {/* the graveyard — one chip per named failure */}
        <div className="flex w-full flex-col gap-3">
          <div
            className="uppercase text-muted [font:var(--riprap-mono-label)] [letter-spacing:var(--riprap-tracking-stamp)]"
            style={rise(frame, 48)}
          >
            why every on-chain attempt so far failed
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {MISTAKES.map((m, i) => (
              <span
                key={`${m.name}-${m.error}`}
                className="flex items-baseline gap-2 border border-hairline px-3 py-1"
                style={rise(frame, 56 + i * 4)}
              >
                <span data-num className="text-muted-soft [font:var(--riprap-mono-label)]">
                  ✗
                </span>
                <span className="text-muted [font:var(--riprap-body-sm)]">{m.error}</span>
                {m.name && (
                  <span className="text-muted-soft [font:var(--riprap-mono-label)]">
                    ({m.name})
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
    </SlideFrame>
  );
};

/* 04 — the product ----------------------------------------------------------- */

/** The lifecycle plates, deck-owned — the appendix pattern (VISION_STEPS):
 * join → gather → rule → claim. The liquidate plate stays off the pitch
 * (previously `LifecycleStrip skipSteps={[5]}`). */
const PRODUCT_STEPS = [
  {
    id: "join",
    step: "01",
    label: "members joining",
    Glyph: Join,
    body: "joining members approve a hash-linked document with the terms for the pool. build the basis for the pools purpose.",
  },
  {
    id: "gather",
    step: "02",
    label: "money gathers",
    Glyph: Gather,
    body: "a pool collects the capital for insurances individually. No money flows between insurance instances.",
  },
  {
    id: "rule",
    step: "03",
    label: "peers decide",
    Glyph: Rule,
    body: "claims adjudicate on-chain with staked jurors, sealed-then-revealed votes, bounded appeals, slashed incoherence.",
  },
  {
    id: "claim",
    step: "04",
    label: "a claim is paid",
    Glyph: Claim,
    body: "after peers approve, the funds are released right away. Solana settles funds and accounting instantly.",
  },
] as const;

const ProductSlide: FC = () => {
  const frame = useSlideFrame();
  return (
    <SlideFrame kicker="the product" headline="on-chain rails for insurance contracts">
      <div className="flex w-full flex-col gap-8">
        <div style={rise(frame, 16)}>
          <ol data-slot="lifecycle-strip" className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {PRODUCT_STEPS.map((tile) => (
              <ExpansionTile key={tile.id} {...tile} />
            ))}
          </ol>
        </div>
        <div className="flex items-start gap-6">
          {PRODUCT_STEPS.map((l, i) => (
            <div
              key={l.step}
              className="flex flex-1 flex-col gap-2 border-t border-hairline pt-4"
              style={rise(frame, 40 + i * 14)}
            >
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
    <SlideFrame
      kicker="the market"
      headline="Millions of communities don't fit conventional insurances"
    >
      <div className="max-w-[76ch] text-ink [font:var(--riprap-title-md)]" style={rise(frame, 12)}>
        We are building the infrastructure that lets those groups create their own risk pools.
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

/* 06 — the pilot ------------------------------------------------------------- */

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
    head: "covers sponsorship",
    body: "companies or regional teams buy covers for their members.",
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
    <SlideFrame kicker="the pilot" headline="a knife-assault mutual aid for breakpoint">
      <div
        className="max-w-[100ch] text-body [font:var(--riprap-title-md)]"
        style={rise(frame, 12)}
      >
        <span className="text-accent [font:var(--riprap-mono-number)] mr-6">
          Blade Pool @ Breakpoint 2026
        </span>
        run in front of the entire Solana ecosystem.
      </div>
      <div className="flex w-full items-start gap-10">
        <div className="flex flex-1 flex-col gap-5 list list-disc">
          <ol className="list-disc ml-6 flex flex-col gap-3 text-2xl">
            {LAUNCH_REASONS.map((r, i) => (
              <li>{r.head}</li>
            ))}
          </ol>
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
            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-baseline gap-x-8 gap-y-1.5">
              <span className="uppercase text-muted-soft [font:var(--riprap-mono-label)] [letter-spacing:var(--riprap-tracking-stamp)]">
                tiers
              </span>
              <span className="uppercase text-muted-soft [font:var(--riprap-mono-label)] [letter-spacing:var(--riprap-tracking-stamp)]">
                entry
              </span>
              <span className="uppercase text-muted-soft [font:var(--riprap-mono-label)] [letter-spacing:var(--riprap-tracking-stamp)]">
                payout cap
              </span>
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
    <SlideFrame
      kicker="the business"
      headline={
        <>
          Same insurance economics
          <br />
          unlimited room to experiment.
        </>
      }
    >
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
    <SlideFrame kicker="the ask" headline={<>raising $700k pre-seed at $7M</>}>
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

/* 09 — the team (layout copied from the accord deck's builder slide) --------- */

const FABIAN_ROWS = [
  "Dr.-Ing., engineering",
  "full-time crypto since 2014",
  "first hire paid by a blockchain, ever",
  "BitShares escrow & treasury — built",
  "fabian@die-schuhs.de · x.com/@xeroc",
];

const CORINNA_ROWS = [
  "centuries of experience",
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
            the team
          </div>
          <h2 className="max-w-[24ch] text-ink [font:var(--riprap-display-xl)] [letter-spacing:var(--riprap-tracking-display)]">
            decades of shipping in the team
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

/* 10 — close ------------------------------------------------------------------ */

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

/* A1 — appendix (the destination stack the vision slide carried pre-re-stage) */

/** The five machines on-chain cover needs, one per step, ordinals matching
 * the plates (n ↔ tile step): custody, adjudication, recurrence, reserve
 * capital, reinsurance. Copy per meta/PITCH.md §12 (destination
 * vocabulary). Presented as the vision slide before the 2026-09-18
 * re-stage; kept as the deck's reference ending. */
const VISION_STEPS = [
  {
    id: "gather",
    step: "01",
    head: "money gathers",
    body: (
      <>
        the pool is <span className="font-extrabold text-white/80">a program, not a company</span> —
        it holds usdc and nothing else. members chip in, one pool per defined risk.
      </>
    ),
    label: "money gathers",
    Glyph: Gather,
  },
  {
    id: "rule",
    step: "02",
    head: "peers decide",
    body: (
      <>
        claims are judged by staked members of the same pool — drawn at random, sealed votes,
        appeals double the jury. adjudication by{" "}
        <span className="font-extrabold text-white/80">accord</span>, honestly an arbitration
        oracle.
      </>
    ),
    label: "peers decide",
    Glyph: Rule,
  },
  {
    id: "renew",
    step: "03",
    head: "cover renews",
    body: (
      <>
        contributions recur through the pull payments rail. We've alreday built that with{" "}
        <span className="font-extrabold text-white/80"> tributary.so</span>.
      </>
    ),
    label: "cover renews",
    Glyph: Renew,
  },
  {
    id: "backstop",
    step: "04",
    head: "a backstop grows",
    body: (
      <>
        <span className="font-extrabold text-white/80">external risk capital</span> stakes a reserve
        beneath the pool and earns a rule-set share of its surplus.
      </>
    ),
    label: "a backstop grows",
    Glyph: Backstop,
  },
  {
    id: "stack",
    step: "05",
    head: "pools cover pools",
    body: (
      <>
        mutuals cover each other: first loss below, the tail above.{" "}
        <span className="font-extrabold text-white/80">reinsurance and tranching</span>.
      </>
    ),
    label: "pools cover pools",
    Glyph: Stack,
  },
] as const;

const AppendixSlide: FC = () => {
  const frame = useSlideFrame();
  return (
    <SlideFrame kicker="appendix" headline="the destination stack">
      <div className="flex w-full flex-col gap-8">
        <div
          className="max-w-[62ch] text-ink [font:var(--riprap-title-md)]"
          style={rise(frame, 16)}
        >
          An open protocol for insurance, on chain.
        </div>

        <div style={rise(frame, 32)}>
          <ol
            data-slot="expansion-strip"
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
          >
            {VISION_STEPS.map((tile) => (
              <ExpansionTile key={tile.step} {...tile} />
            ))}
          </ol>
        </div>

        {/* same grid template as the strip — column i elaborates plate i */}
        <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {VISION_STEPS.map((s, i) => (
            <div
              key={s.step}
              className="flex flex-col gap-2 border-t border-hairline pt-4"
              style={rise(frame, 52 + i * 12)}
            >
              <div className="text-muted [font:var(--riprap-body-sm)]">{s.body}</div>
            </div>
          ))}
        </div>
      </div>
    </SlideFrame>
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
      "10s. Riprap — real-world risk protection on Solana. Status honesty: pool program built, arbitration live on devnet, the event-mutual orchestrator (hanse) in build, payment rail live on mainnet. Pre-Seed raise, 2026.",
    component: TitleSlide,
  },
  {
    id: "vision",
    label: "the vision",
    notes:
      "25s. Why the world is ripe for internet insurance. Call a smart contract what it is: business logic that runs 24/7/365 — autonomous, permissionless, transparent. No surprise defi trading works great on-chain — it is well-understood business logic. You know what else is well-understood business logic? Insurance. Then the table, top to bottom: the first two rows are the business — tradinsure pools money and decides payouts, and so does web3 insure; every row below is the rails — transparent (the balance is a public number — solvency provable, not asserted), fast (payouts in minutes, not days), global & 24/7/365, permissionless (anyone with a wallet), composable (pools stack into tranched capital) — web3 only. Overhead dies on the way: the ~26¢-per-dollar back office becomes transaction fees. The five-machine destination stack moved to the appendix — walk it there if asked. Segue: so why doesn't on-chain insurance exist today — the problem, next slide.",
    component: VisionSlide,
  },
  {
    id: "problem",
    label: "the problem",
    notes:
      "30s. The frame: traditional insurance is a slow, expensive monolith. One number, very big: ~26¢ of every US premium dollar is spent before a claim is paid (Verisk/APCIA '25) — the fixed-cost back office; at that floor microinsurance is often infeasible. Then the cloud, gesture once, don't read it: the 2020–22 graveyard, one named failure per project — Neptune Mutual (upfront lump sum; token-vote claims), Cover Protocol (exploited itself), Solace (shared idle pool), OpenCover (web3 portfolio cover), Unslashed (no float income), InsurAce (twenty thin chains), Bridge Mutual (farmed, not mutual), Risk Harbor (wLUNA collateral). Same lesson at company scale: the rails were never the whole machine — custody without adjudication, one pool, or permissioning is just a slower bank. If asked, the mutual-history backing: pooled protection is the oldest fix — the formal version is $1.61T and winning (ICMIF '24); the informal version dies of opacity, disputes, and scale, which is why the friendly societies became licensed mutuals — formalization fixed trust at the price of the charter. The solvency and jurisdiction pains stay in Q&A — the vision table carries those ✗. Land: the behavior is universal, the on-ramp does not exist. Segue: the product — the rails that remove each ✗, next slide.",
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
    label: "the pilot",
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
    id: "ask",
    label: "the ask",
    notes:
      "30s. $700k on a post-money SAFE plus a bounded token warrant; range $600–800k; opening cap $7M post — 10%; 18 months; primary milestone organizer-initiated pools. The narrative: capital → de-risk → prove → unlock — security, product, proof, legal, growth. If asked what $100k gets an angel to: from an audited working product and an operational pilot to a repeatable network of organizer-initiated pools. Angel-ladder construction stays private.",
    component: AskSlide,
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
  {
    id: "appendix",
    label: "appendix — the destination",
    notes:
      "Reference, not presented — the stack the vision slide carried before the 2026-09-18 re-stage. The five machines on-chain cover needs, one per plate: 01 money gathers — programmatic custody: the pool is a program, not a company, it holds USDC and nothing else; 02 peers decide — adjudication: staked members of the same pool, drawn at random, sealed votes, appeals that double the jury — Accord, honestly an arbitration oracle; 03 cover renews — recurring contributions on the payment rail, live on mainnet today; 04 a backstop grows — external risk capital staking the reserve for a rule-set share of surplus; 05 pools cover pools — first loss below, tail above: reinsurance and tranching as protocol properties. Custody, adjudication, recurrence, reserve capital, reinsurance — everything an insurer needs, none of it a company. The machines already exist — payment rail live on mainnet, arbitration live on devnet, pool program built.",
    component: AppendixSlide,
  },
  {
    id: "market",
    label: "the market",
    notes:
      "35s. The story first, then the numbers: millions of communities are too small, too geographically specific, too short-duration, or too low-premium for conventional insurance economics — a $20, 3-day, single-peril cover is sub-economic by construction when ~26¢ of every US P&C premium dollar is spent before a claim is paid (Verisk/APCIA '25). We are building the infrastructure that lets those groups create their own risk pools. Then read the evidence, do not editorialize: $424B protection gap (Swiss Re '25); 344M covered, 88% uncovered (MiN '24); ~26¢ per premium dollar (Verisk '25); $1.61T mutual premiums — the same behavior, formalized (ICMIF '24). If asked: $136B alternative capital gated at $200k QIB tickets (Aon '25); on-chain, $3.4B stolen per year against a $104M cover sector (Chainalysis, DeFiLlama); market scan — Nexus Mutual $5.7M cover fees '25, $2.7M raised ever, $1B+ purchased; OpenCover $4.6M seed '22–23, $141.6M protected '25. Close: one machine addresses every row — a mutual becomes a transaction, surplus returns by rule, the back office is the chain.",
    component: MarketSlide,
  },
];
