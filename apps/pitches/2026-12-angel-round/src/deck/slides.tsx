import {
  Claim,
  ExpansionTile,
  Gather,
  Join,
  LogoLockup,
  Logomark,
  ProblemSolutionCard,
  Renew,
  Rule,
  Stack,
  Wordmark,
} from "@riprap/ui";
import type { FC, ReactNode } from "react";

import { SlideFrame } from "./shell";

/**
 * The seed-raise deck (angel-round working copy: forked 2026-10-12 from
 * the World's Fair demo deck at apps/pitches/2026-11-demo-worlds-fair;
 * first re-stage 2026-10-12 — the intro slide: what an insurance does,
 * mutual and insurance as check columns of one table) — 10 slides + appendix, copy from meta/PITCH.md (the
 * law for every string and number below; citations ride along in mono — the
 * 2026-09-17 headline re-stage, the 2026-09-18 vision/problem re-stages,
 * and the 2026-10-07 title/vision/product/pilot re-stage below are not yet
 * mirrored there). The destination leads: the vision right
 * well-understood business logic on 24/7/365 rails; the tradinsure/web3
 * comparison table) — then the walk back down to today — the problem → the
 * product → the now → the pilot (events are the door, Breakpoint first) → the business
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

/* 01 — title ---------------------------------------------------------------- */

const TitleSlide: FC = () => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-12 deck-narrow:p-6">
      <Logomark size={160} />
      <div className="flex flex-col items-center gap-6">
        <Wordmark size={84} className="tracking-(--riprap-tracking-mega)" />
        <div className="text-ink [font:var(--riprap-display-md)]">
          Insurance, Finally Programmable
        </div>
      </div>
    </div>
  );
};

/* 01b — introduction: what an insurance actually does -------------------- */

/** Copy per founder direction 2026-10-12 (not yet mirrored in meta/PITCH.md),
 * re-staged same day to the compare grammar the vision table uses: the four
 * moves label the rows (01–03 shared, 04 the delta); Mutual checks 01–03,
 * Insurance checks 01–04 — risk capital is the one row that separates them.
 * Marks reuse the vision slide's Mark atom (✓ accent / ✗ muted-soft, mono);
 * the em-dash cell of the previous staging is gone — row 04 reads as a plain
 * absence (✗) in the Mutual column. */
const INTRO_ITEMS: { id: string; label: string; mutual: boolean; insurance: boolean }[] = [
  { id: "pool", label: "people pool money", mutual: true, insurance: true },
  { id: "adjudicate", label: "claims get adjudicated by members", mutual: true, insurance: true },
  { id: "pay", label: "pool pays approved claims", mutual: true, insurance: true },
  {
    id: "capital",
    label: "risk capital earns yield, offers backstop",
    mutual: false,
    insurance: true,
  },
];

const IntroSlide: FC = () => (
  <SlideFrame kicker="introduction" headline="What an Insurance Actually Does">
    <div className="flex w-full flex-col">
      {/* column heads — the empty label column, then the two terms as stamps */}
      <div className="deck-narrow:grid-cols-[minmax(0,1fr)_3rem_3rem] grid grid-cols-[minmax(0,1fr)_22ch_22ch] items-baseline gap-6 pb-4">
        <span />
        {["mutual", "insurance"].map((col) => (
          <span
            key={col}
            className="text-center uppercase text-muted [font:var(--riprap-mono-label)] [letter-spacing:var(--riprap-tracking-stamp)]"
          >
            {col}
          </span>
        ))}
      </div>
      {INTRO_ITEMS.map((r, i) => (
        <div
          key={r.id}
          className="deck-narrow:grid-cols-[minmax(0,1fr)_3rem_3rem] grid grid-cols-[minmax(0,1fr)_22ch_22ch] items-center gap-6 border-t border-hairline py-5"
        >
          <div className="text-ink [font:var(--riprap-display-sm)]">
            <span data-num className="mr-4 text-accent [font:var(--riprap-mono-number)]">
              {String(i + 1).padStart(2, "0")}
            </span>
            {r.label}
          </div>
          <span className="text-center">
            <Mark yes={r.mutual} />
          </span>
          <span className="text-center">
            <Mark yes={r.insurance} />
          </span>
        </div>
      ))}
    </div>
  </SlideFrame>
);

/* 02 — the vision (why internet insurance, why now) ------------------------ */

/** The ripeness argument (re-staged 2026-10-07; not yet mirrored in
 * meta/PITCH.md): the statement is the slide — trust math, not paperwork.
 * Claims judged on-chain, reserves earning in DeFi, insurance that scales
 * like software. The tradinsure/web3 comparison table stays as the
 * receipts, demoted below the statement — smaller marks, muted labels,
 * tighter rows. The five-machine destination strip this slide carried
 * before the 2026-09-18 re-stage lives on in the appendix below. */
const COMPARE_COLS = ["traditional insurance", "web3 insurance"] as const;

/** One cell mark — a check or a cross, mono, nothing else in the cell. */
const Mark: FC<{ yes: boolean }> = ({ yes }) => (
  <span data-num className={`${yes ? "text-accent" : "text-muted-soft"} text-2xl`}>
    {yes ? "✓" : "✗"}
  </span>
);

/** ✓ = supported, ✗ = not. The first two rows are the business — both
 * worlds do them; the rest are the rails — only the web3 column has them.
 * Re-staged 2026-10-22: "fast" renamed "settles instantly" — the point is
 * not speed-as-UX but that the settlement intermediaries (premium finance,
 * custodian, claims desk, paying bank) collapse to one transfer; the
 * statement above names them. */
const COMPARE_ROWS: { id: string; label: ReactNode; trad: boolean; web3: boolean }[] = [
  { id: "pool-money", label: "pool money", trad: true, web3: true },
  { id: "decide-payouts", label: "decide payouts", trad: true, web3: true },
  { id: "transparent", label: "transparent", trad: false, web3: true },
  { id: "settles", label: "settles instantly", trad: false, web3: true },
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
  return (
    <SlideFrame kicker="the vision" headline="Trust Math &amp; Code over Paperwork">
      {/* the statement — the heart of the slide; re-staged 2026-10-22: the
       * settlement intermediaries are named — the point is that they go away */}
      <div className="max-w-[58ch] text-ink [font:var(--riprap-display-sm)]">
        When claims are judged on-chain and reserves settle on-chain, the intermediaries between
        member and money — premium finance, custodian, claims desk, paying bank — collapse.
        Insurance scales like software.
      </div>
      {/* the comparison table — same business, different rails; receipts, not the argument */}
      <div className="flex w-full flex-col">
        <div className="deck-narrow:grid-cols-[minmax(0,1fr)_3rem_3rem] grid grid-cols-[minmax(0,1fr)_22ch_22ch] items-baseline pb-4">
          <span />
          {COMPARE_COLS.map((col) => (
            <span
              key={col}
              className="text-center uppercase text-muted [letter-spacing:var(--riprap-tracking-stamp)]"
            >
              {col}
            </span>
          ))}
        </div>
        {COMPARE_ROWS.map((r) => (
          <div
            key={r.id}
            className="deck-narrow:grid-cols-[minmax(0,1fr)_3rem_3rem] grid grid-cols-[minmax(0,1fr)_22ch_22ch] items-center border-t border-hairline py-1.5"
          >
            <span className="text-muted [font:var(--riprap-body-md)]">{r.label}</span>
            <span className="text-center">
              <Mark yes={r.trad} />
            </span>
            <span className="text-center">
              <Mark yes={r.web3} />
            </span>
          </div>
        ))}
      </div>
    </SlideFrame>
  );
};

/* 03 — the problem ----------------------------------------------------------- */

/** The monolith re-staged (2026-09-18 off
 * meta/marketing/07-brand-assets/why-on-chain.md; not yet mirrored in
 * meta/PITCH.md): re-staged again 2026-10-08 — two numbers side by side,
 * ~26¢ of every premium dollar spent before a claim is paid and the
 * 11.6–18% interest investors earn on risk capital, each explained below
 * itself, source riding along in mono. The solvency and jurisdiction rows
 * were retired in the 2026-09-18 re-stage; the vision table still carries
 * those ✗. */

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
  return (
    <SlideFrame kicker="the problem" headline="Insurance is a slow, expensive monolith.">
      {/* re-staged 2026-10-08: two numbers, side by side — the overhead and
       * the cost of capital — each explained below itself. The 30–60 day
       * and microinsurance bullets retired in the same re-stage. */}
      <div className="deck-narrow:flex-col deck-narrow:gap-8 flex w-full items-start gap-16">
        <div className="flex flex-1 flex-col gap-4" data-num>
          <span className="deck-narrow:text-[4.5rem] text-accent font-mono text-[7rem] leading-none font-semibold tracking-(--riprap-tracking-display)">
            ~26&cent;
          </span>
          <span className="text-ink w-md [font:var(--riprap-display-sm)]">
            of every premium dollar is spent before a claim is paid.
          </span>
          <span className="text-muted-soft [font:var(--riprap-mono-label)]">
            Verisk/APCIA &rsquo;25
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-4" data-num>
          <span className="deck-narrow:text-[4.5rem] text-accent font-mono text-[7rem] leading-none font-semibold tracking-(--riprap-tracking-display)">
            11&ndash;18%
          </span>
          <span className="text-ink w-md [font:var(--riprap-display-sm)]">
            interest investors earn on risk capital.
          </span>
        </div>
      </div>
    </SlideFrame>
  );
};

/** The competitive set: fees / raise / cover per player, chain in tiny
 * type — every row reads ethereum or off-chain, so the empty Solana
 * column is the argument. Numbers are report-pinned (Nexus '25 report,
 * evertas.com, OpenCover '25 recap). The 2020–22 cohort is no longer a
 * row — it lives below as the named mistakes carousel. */
const FIELD_ROWS: {
  name: string;
  chain: string;
  cells: { v: string; sub?: string }[];
}[] = [
  {
    name: "Nexus Mutual",
    chain: "ethereum · arbitrum · kyc",
    cells: [
      { v: "$5.7M", sub: "cover fees '25" },
      { v: "$2.7M", sub: "ever · no VC" },
      { v: "$1B+", sub: "purchased '25" },
    ],
  },
  {
    name: "OpenCover",
    chain: "base · ethereum · off-chain co",
    cells: [
      { v: "—", sub: "undisclosed" },
      { v: "$4.6M", sub: "seed '22–23" },
      { v: "$141.6M", sub: "protected '25" },
    ],
  },
];

export const IncumbantsProblemSlide: FC = () => {
  return (
    <SlideFrame kicker="the competition" headline="there's basically no competitor.">
      <div className="flex w-full flex-col gap-12">
        <div className="deck-narrow:grid-cols-3 deck-narrow:gap-x-3 grid grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))] gap-x-12 text-sm tracking-[0.2em] text-text-secondary">
          <div className="deck-narrow:col-span-3" />
          <div className="deck-narrow:tracking-normal text-right">FEES &rsquo;25</div>
          <div className="deck-narrow:tracking-normal text-right">RAISED</div>
          <div className="deck-narrow:tracking-normal text-right">COVER</div>
        </div>
        {FIELD_ROWS.map((r) => (
          <div
            key={r.name}
            className="deck-narrow:grid-cols-3 deck-narrow:gap-x-3 grid grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))] items-baseline gap-x-12 border-t border-white/10 pt-5"
          >
            <div className="deck-narrow:col-span-3 flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="font-heading text-xl font-bold tracking-tight text-nearwhite">
                  {r.name}
                </span>
              </div>
              <span className="text-sm text-text-secondary">{r.chain}</span>
            </div>
            {r.cells.map((c) => (
              <div
                key={`${c.v}-${c.sub ?? ""}`}
                className="flex flex-col items-end gap-1 text-right"
              >
                <span className="deck-narrow:text-base text-xl tabular-nums text-nearwhite">
                  {c.v}
                </span>
                {c.sub ? <span className="text-sm text-text-secondary">{c.sub}</span> : null}
              </div>
            ))}
          </div>
        ))}

        {/* the graveyard — one chip per named failure */}
        <div className="flex w-full flex-col gap-3">
          <div className="uppercase text-muted [font:var(--riprap-mono-label)] [letter-spacing:var(--riprap-tracking-stamp)]">
            why every on-chain attempt so far failed
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {MISTAKES.map((m) => (
              <span
                key={`${m.name}-${m.error}`}
                className="flex items-baseline gap-2 border border-hairline px-3 py-1"
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
    label: "claim paid",
    Glyph: Claim,
    body: "after peers approve, the funds are released right away. Solana settles funds and accounting instantly.",
  },
] as const;

const ProductSlide: FC = () => {
  return (
    <SlideFrame kicker="the product" headline="Mutuals First, Insurances Next">
      {/* the positioning statement — mutuals are the trusted foundation */}
      <div className="max-w-[68ch] text-ink [font:var(--riprap-title-md)]">
        People pool risk and share the upside transparently. The foundation for a global, composable
        market of insurance and risk capital.
      </div>
      <div className="flex w-full flex-col gap-8">
        <ol data-slot="lifecycle-strip" className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {PRODUCT_STEPS.map((tile) => (
            <ExpansionTile key={tile.id} {...tile} />
          ))}
        </ol>
        <div className="deck-narrow:grid deck-narrow:grid-cols-2 deck-narrow:items-start deck-narrow:gap-4 deck-narrow:md:grid-cols-4 flex items-start gap-6">
          {PRODUCT_STEPS.map((l) => (
            <div key={l.step} className="flex flex-1 flex-col gap-2 border-t border-hairline pt-4">
              <div className="text-muted [font:var(--riprap-body-sm)]">{l.body}</div>
            </div>
          ))}
        </div>
      </div>
    </SlideFrame>
  );
};

/* 05 — the now ----------------------------------------------------------------- */

/** The why-now slide (added 2026-09-18; not yet mirrored in meta/PITCH.md):
 * three pieces landing at once — a stablecoin settlement layer deep enough
 * to denominate premiums and claims in, and the two infrastructure rails a
 * real insurance contract needs, both ours: pull payments (Tributary) and
 * on-chain adjudication (Accord). The ✓ stamp is the point — two of the
 * three prerequisites are built by us. Re-staged 2026-10-22: the settlement
 * card's asserted "institutional distribution layer" (and the flagged
 * $16.3B stat) is replaced by named receipts — Lloyds Bank's tokenised-
 * deposit gilt purchase on a public chain with its own validator node
 * (LBG press release 2026-01-20), the six-UK-bank shared-ledger sterling
 * pilot (UK Finance), and the GENIUS Act (US, law July 2025). Lloyds Bank
 * plc ≠ Lloyd's of London — never conflate the two in copy. */
const NOW_STEPS = [
  {
    id: "stablecoin-settlement",
    step: "01",
    label: "premiums settle stable",
    Glyph: Stack,
    head: "stablecoin settlement on solana",
    body: (
      <>
        Premiums and claims must settle in something people actually want to hold — USDC. Proof the
        money already moved: Lloyds Bank bought a gilt with tokenised deposits on a public
        blockchain, running its own validator node. Six UK banks pilot shared-ledger sterling. The
        GENIUS Act is law.
      </>
    ),
    ours: false,
  },
  {
    id: "pull-payments",
    step: "02",
    label: "recurring premiums pull",
    Glyph: Renew,
    head: "pull payments on solana",
    body: (
      <>
        recurring premium payments must be convenient and reliable — which they cannot be without
        pull payment support on Solana.{" "}
        <a href="https://tributary.so" data-num className="text-accent font-mono">
          tributary.so
        </a>
      </>
    ),
    ours: true,
  },
  {
    id: "adjudication",
    step: "03",
    label: "claims adjudicate",
    Glyph: Rule,
    head: "claims adjudication on-chain",
    body: (
      <>
        with the recent development of Accord for on-chain dispute resolution and adjudication, the
        required tool now exists for permissionless and decentralized claims adjudication.{" "}
        <a href="https://useaccord.xyz" data-num className="text-accent font-mono">
          useaccord.xyz
        </a>
      </>
    ),
    ours: true,
  },
] as const;

const NowSlide: FC = () => {
  return (
    <SlideFrame kicker="why now" headline="Three pieces clicked">
      <div className="max-w-[68ch] text-ink [font:var(--riprap-title-md)]">
        Insurance needed stable money, recurring premiums, and trustless claims, and all three are
        now real on Solana.
      </div>
      <div className="flex w-full flex-col gap-8">
        <ol data-slot="expansion-strip" className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {NOW_STEPS.map((tile) => (
            <ExpansionTile key={tile.id} {...tile} />
          ))}
        </ol>
        <div className="deck-narrow:grid deck-narrow:grid-cols-2 deck-narrow:items-start deck-narrow:gap-4 deck-narrow:md:grid-cols-3 flex w-full items-start gap-6">
          {NOW_STEPS.map((n) => (
            <div key={n.step} className="flex flex-1 flex-col gap-2 border-t border-hairline pt-4">
              <div className="deck-narrow:flex-wrap flex items-baseline justify-between gap-3">
                <span className="text-ink [font:var(--riprap-title-sm)]">{n.head}</span>
                {n.ours && (
                  <span className="text-accent bg-ink px-1.5 py-1 border-3 border-accent whitespace-nowrap uppercase [font:var(--riprap-mono-label)] [letter-spacing:var(--riprap-tracking-stamp)]">
                    ✓ built by us
                  </span>
                )}
              </div>
              <div className="text-muted [font:var(--riprap-body-sm)]">{n.body}</div>
            </div>
          ))}
        </div>
      </div>
    </SlideFrame>
  );
};

/* 06 — the market ------------------------------------------------------------ */

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

export const MarketSlide: FC = () => {
  return (
    <SlideFrame
      kicker="the market"
      headline="Millions of communities don't fit conventional insurances"
    >
      <div className="max-w-[76ch] text-ink [font:var(--riprap-title-md)]">
        We are building the infrastructure that lets those groups create their own risk pools.
      </div>
      <div className="deck-narrow:grid deck-narrow:grid-cols-2 deck-narrow:items-start deck-narrow:gap-4 flex w-full items-start gap-6">
        {SKIPPED_COMMUNITIES.map((c) => (
          <div key={c.head} className="flex flex-1 flex-col gap-2 border-t border-hairline pt-4">
            <div className="text-ink [font:var(--riprap-title-sm)]">{c.head}</div>
            <div className="text-muted [font:var(--riprap-body-sm)]">{c.body}</div>
          </div>
        ))}
      </div>
      <div className="flex w-full flex-col gap-4" data-num>
        <div className="flex items-baseline">
          <span className="text-sm tracking-[0.2em] text-text-secondary">EVIDENCE</span>
        </div>
        {EVIDENCE_ROWS.map((r) => (
          <div
            key={r.label}
            className="deck-narrow:flex-wrap deck-narrow:gap-x-6 flex items-baseline gap-8 border-t border-hairline pt-3"
          >
            <span className="deck-narrow:w-[14ch] w-[24ch] text-right text-accent [font:var(--riprap-mono-number)]">
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

/* 06 — the pilot (re-staged 2026-10-07: aid + bounties at Breakpoint) ------ */

/** The pilot batch, narrowed from the landing's mutuals directory
 * (apps/landing/src/mutuals/data.ts — every number is that file's §5 policy
 * / terms tables verbatim; the three hot-drink bounties share one mechanic
 * and ride one row, Blade Pool's devnet/mainnet listings are one pool).
 * Two classes on the same mechanics: mutuals where members cover each
 * other, bounties that pay for confirmed acts. */
const PILOT_POOLS: {
  name: string;
  kind: "mutual" | "bounty";
  pays: string;
  entry: string;
  payout: string;
}[] = [
  {
    name: "Blade Pool",
    kind: "mutual",
    pays: "bodily injury caused by another person with a knife or blade, during the conference",
    entry: "$10–$40",
    payout: "up to $4,000",
  },
  {
    name: "Chairmageddon",
    kind: "mutual",
    pays: "every seat taken at the opening ceremony — and you stood the whole thing",
    entry: "$10",
    payout: "$40",
  },
  {
    name: "NGMI Hairline",
    kind: "mutual",
    pays: "new gray hair first visible during the conference — graded from a few to Gandalf",
    entry: "$10",
    payout: "up to $200",
  },
  {
    name: "Coffee Apocalypse",
    kind: "mutual",
    pays: "the coffee point runs out while you're standing in the queue",
    entry: "$10",
    payout: "$25",
  },
  {
    name: "OnlyFriends",
    kind: "bounty",
    pays: "confirmed introductions to listed VIPs — paid per introduction, capped at ten",
    entry: "$50",
    payout: "up to $500",
  },
  {
    name: "Hot-drink Runs",
    kind: "bounty",
    pays: "bring Raj, Lily, or Toly the hot drink they asked for — hand to hand, still hot",
    entry: "$5",
    payout: "$50",
  },
  {
    name: "Mert of the Year",
    kind: "bounty",
    pays: "an over-the-top trophy he did not ask for — pays the one he declares best",
    entry: "$10",
    payout: "$1,000",
  },
];

const LaunchSlide: FC = () => {
  return (
    <SlideFrame kicker="the pilot" headline="Piloting, Pivoting, Iterating">
      {/* the statement — the pivot in one breath */}
      <div className="max-w-[76ch] text-ink [font:var(--riprap-title-md)]">
        We extended slow risk pools for fast crowdfunded bounties on the same mechanics, so every
        pilot, silly or serious, turns into a lesson that sharpens the engine before real-world
        insurance.
      </div>
      {/* the batch — two classes, one engine; numbers are §5 verbatim */}
      <div className="flex w-full flex-col gap-1" data-num>
        <div className="grid grid-cols-[minmax(0,18ch)_9ch_minmax(0,1fr)_9ch_13ch] items-baseline gap-x-6 pb-2">
          {["pool", "class", "pays for", "entry", "payout"].map((h) => (
            <span
              key={h}
              className={`uppercase text-muted-soft [font:var(--riprap-mono-label)] [letter-spacing:var(--riprap-tracking-stamp)]${h === "entry" || h === "payout" ? " text-right" : ""}`}
            >
              {h}
            </span>
          ))}
        </div>
        {PILOT_POOLS.map((p) => (
          <div
            key={p.name}
            className="grid grid-cols-[minmax(0,18ch)_9ch_minmax(0,1fr)_9ch_13ch] items-baseline gap-x-6 border-t border-hairline py-2"
          >
            <span className="text-ink [font:var(--riprap-title-sm)]">{p.name}</span>
            <span className="uppercase text-muted [font:var(--riprap-mono-label)]">{p.kind}</span>
            <span className="text-muted [font:var(--riprap-body-sm)]">{p.pays}</span>
            <span className="text-right text-accent [font:var(--riprap-mono-number)]">
              {p.entry}
            </span>
            <span className="text-right text-accent [font:var(--riprap-mono-number)]">
              {p.payout}
            </span>
          </div>
        ))}
      </div>
    </SlideFrame>
  );
};

/* 08 — the business ---------------------------------------------------------- */

const BUSINESS_LADDER = [
  { v: "0%", label: "protocol take on pilots, they exist to confirm the market" },
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
      <div className="max-w-[76ch] text-ink [font:var(--riprap-title-md)]">
        We earn like an insurer, through a share of surplus and fees for running pools.
      </div>
      <div className="flex w-full flex-col gap-8">
        <div className="flex flex-col gap-4" data-num>
          {BUSINESS_LADDER.map((r) => (
            <div
              key={r.v}
              className="deck-narrow:flex-col deck-narrow:items-start deck-narrow:gap-1 flex items-baseline gap-8 border-t border-hairline pt-4"
            >
              <span className="deck-narrow:w-auto deck-narrow:text-left w-[18ch] text-right text-accent [font:var(--riprap-mono-number)]">
                {r.v}
              </span>
              <span className="flex-1 text-ink [font:var(--riprap-title-sm)]">{r.label}</span>
            </div>
          ))}
        </div>
      </div>
    </SlideFrame>
  );
};

/* 09 — the ask --------------------------------------------------------------- */

const ASK_TERMS = [
  { v: "$700k", sub: "raise · range $600–800k" },
  { v: "SAFE + warrant", sub: "post-money · token warrant, bounded and defined pre-open" },
  { v: "$7M", sub: "post-money valuation cap" },
  { v: "18 months", sub: "runway · primary milestone: organizer-initiated pools" },
];

// const UNLOCK_STEPS = [
//   "security — audit the arbitration layer and the pool/hanse programs",
//   "product — hanse orchestrator → SDK → end-to-end suite",
//   "proof — the pilots, results published",
//   "legal — the structure for broader membership",
//   "growth — convert pilot traction into organizer-initiated pools",
// ];

export const AskSlide: FC = () => {
  return (
    <SlideFrame kicker="the ask" headline={<>raising $700k pre-seed at $7M</>}>
      <div className="max-w-[56ch] text-ink [font:var(--riprap-title-md)]">
        Seeking funds for product, legal and growth
      </div>
      <div
        className="deck-narrow:flex-col deck-narrow:gap-8 flex w-full items-start gap-10"
        data-num
      >
        <div className="flex flex-1 flex-col gap-6">
          {ASK_TERMS.map((t) => (
            <div key={t.v} className="flex flex-col gap-1">
              <span className="text-accent [font:var(--riprap-mono-number-lg)]">{t.v}</span>
              <span className="text-muted [font:var(--riprap-mono-label)]">{t.sub}</span>
            </div>
          ))}
        </div>
        {/*
        <div className="flex flex-1 flex-col gap-3">
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
        </div>
        */}
      </div>
    </SlideFrame>
  );
};

/* 10 — the team (layout copied from the accord deck's builder slide) --------- */

const FABIAN_ROWS = [
  "Deep into governance and treasury",
  "consistent pattern of early execution",
  "500M+ blocks produced",
  "Early in MakerDAO, BitShares, Steemit, Solana",
];

const STEFAN_ROWS = [
  "software eng. + math",
  "runs RPC nodes on the side",
  "hardware ops at scale",
  "data analysis for pred. mkts",
];
const CORINNA_ROWS = [
  //"centuries of experience",
  "the unrelenting",
  "number cruncher",
  "devils advocate",
  "on shift 24/7",
];

/** imgAlign tunes the square's object-cover anchor (stefan's portrait is
 * 896×1195 — bottom-anchored, the top of the frame is dropped). */
const PERSONAS: {
  img: string;
  alt: string;
  caption: string;
  rows: string[];
  imgAlign?: "bottom";
}[] = [
  {
    img: "fabian.webp",
    alt: "Dr.-Ing. Fabian Schuh",
    caption: "Dr.-Ing. Fabian Schuh · engineering PhD",
    rows: FABIAN_ROWS,
  },
  {
    img: "stefan.webp",
    alt: "Dr. Stefan Schießl",
    caption: "Dr. Stefan Schießl · applied math PhD",
    rows: STEFAN_ROWS,
    imgAlign: "bottom",
  },
  {
    img: "corinna.webp",
    alt: "Corinna — ai agent",
    caption: "Corinna · ai agent 🤖",
    rows: CORINNA_ROWS,
  },
];

/** The achievement wall — ambience, not a reading list; the audience catches
 * fragments, that's the point. */
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
  return (
    <div className="relative h-full w-full">
      <div className="deck-narrow:pr-[7cqw] flex h-full flex-col justify-center gap-10 pl-[7cqw] pr-[30cqw]">
        <div className="flex flex-col gap-5">
          <div className="uppercase text-accent [font:var(--riprap-mono-label)] [letter-spacing:var(--riprap-tracking-stamp)]">
            the team
          </div>
          <h2 className="max-w-[30ch] text-ink [font:var(--riprap-display-xl)] [letter-spacing:var(--riprap-tracking-display)]">
            A Decade of Building What&rsquo;s Next
            <br />
            Before It Was Obvious.
          </h2>
          {/* the early-timeline thesis — years in mono (type law); terms
           * founder-dated 2026-10-12: DEX = BitShares, tokenomics = MakerDAO
           * whitepaper review + Steemit, prediction markets = exbet, scalar
           * betting = the 2022 line — early again, this time for insurance */}
          <div className="max-w-[65ch] text-ink [font:var(--riprap-title-md)]">
            DEX (
            <span data-num className="font-mono">
              2014
            </span>
            ), Tokenomics (
            <span data-num className="font-mono">
              2016
            </span>
            ), Prediction Markets (
            <span data-num className="font-mono">
              2018
            </span>
            ), Scalar Betting (
            <span data-num className="font-mono">
              2022
            </span>
            ),
            <br />
            Recurring Paymnets (
            <span data-num className="font-mono">
              2025
            </span>
            ). Always Early. Always Building.
          </div>
        </div>
        {/* three personas, equal-width square photos — stefan's portrait
         * (896×1195) is square-cropped in CSS, anchored to the bottom of
         * the frame; the jpg original stays in public/ */}
        <div className="deck-narrow:flex-col deck-narrow:gap-10 flex items-start gap-12">
          {PERSONAS.map((p) => (
            <figure key={p.img} className="flex min-w-0 flex-1 flex-col gap-4">
              <img
                src={p.img}
                alt={p.alt}
                className={`aspect-square w-64 h-auto border border-hairline object-cover${p.imgAlign === "bottom" ? " object-bottom" : ""}`}
              />
              <figcaption className="text-muted [font:var(--riprap-mono-label)]">
                {p.caption}
              </figcaption>
              <div className="flex flex-col gap-2.5 pt-1">
                {p.rows.map((r) => (
                  <div key={r} className="text-body [font:var(--riprap-body-sm)]">
                    <span className="text-accent">▶</span> {r}
                  </div>
                ))}
              </div>
            </figure>
          ))}
        </div>
      </div>
      <div
        className="deck-narrow:hidden absolute inset-y-0 right-0 flex w-[50ch] items-center overflow-hidden font-mono"
        style={{
          maskImage: "linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)",
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
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-12 px-[7cqw] text-center">
      <div className="flex flex-col items-center gap-5">
        <LogoLockup size={64} />
        <div className="h-px w-56 bg-accent" />
      </div>
      <div className="flex flex-wrap justify-center gap-12">
        {LINKS.map((l) => (
          <span key={l.url} className="flex flex-col items-center gap-1">
            <span className="text-ink [font:var(--riprap-mono-number)]">{l.url}</span>
            <span className="text-muted [font:var(--riprap-mono-label)]">{l.note}</span>
          </span>
        ))}
      </div>
      <div className="text-ink [font:var(--riprap-display-lg)]">
        Insurance, Finally Programmable.
      </div>
    </div>
  );
};

/* A0 — appendix Q&A (the GP review's four hard questions) ------------------ */

/** The four questions every IC asks, one ProblemSolutionCard each — copy
 * verbatim from apps/pitches/2026-11-pitch-seed-raise/PROBLEMS.md (2026-09-18 GP teardown →
 * founder answers; not yet mirrored in meta/PITCH.md). Questions condensed
 * to under seven words; answers as spoken. First slide of the appendix: the
 * reference half of the deck opens by naming its own weakest points. */
const HARD_QUESTIONS: { index: string; q: string; a: string }[] = [
  {
    index: "01",
    q: "Can you legally do this?",
    a: "The mutual is limited in scope and time to avoid UK insurance regulation. We review regulations step by step as we progress. For full-fledged insurance, regulations might apply. The extend: unknown.",
  },
  {
    index: "02",
    q: "Can strangers adjudicate claims?",
    a: "Adjudication is key; optimal parameters must be set case by case. We've defined them for the pilot. For pilot, clear no! Foundation has been layed out to integrate Solana's Attestation system. That allows specifying jurors clearly.",
  },
  {
    index: "03",
    q: "Why the such a pilot first?",
    a: "The cheapest place to find adjudication failures: capped payouts ($1k–4k), tiny stakes ($10–40), bounded lifetime, one venue. Go to market quickly, with least regulatory risk and attrack attention.",
  },
  {
    index: "04",
    q: "Who builds the company?",
    a: "Started solo, became a real business. None of this would've happened without mtnDAO. On-chain insurance has been on our minds for half a decade. Aiming for insurance/regulatory counsel as advisor and a risk/legal hire post-raise. ",
  },
];

export const AppendixQASlide: FC = () => {
  return (
    <SlideFrame kicker="the problems" headline="The hard questions that need solving.">
      <div className="deck-narrow:grid-cols-1 grid w-full grid-cols-2 gap-6">
        {HARD_QUESTIONS.map((c) => (
          <div key={c.index}>
            <ProblemSolutionCard index={c.index} question={c.q} answer={c.a} />
          </div>
        ))}
      </div>
    </SlideFrame>
  );
};

/* A1 — appendix: the industry has been trying since 2017 (added 2026-10-22;
 * not yet mirrored in meta/PITCH.md) — the receipts that it is time: the
 * 2017–22 attempts were private consortium ledgers and died (B3i — 20+
 * insurers/reinsurers, $16M raised '19 — insolvent July '22, Insurance
 * Journal; AXA fizzy — parametric flight delay on Ethereum, launched '17,
 * closed '19 citing low market appetite and weak distribution, Insurance
 * Post; Marsh Risk Exchange '19; BUILDINGBLOCK). What changed is not
 * insurance — the money moved to PUBLIC rails (Lloyds Bank gilt purchase
 * with tokenised deposits, own validator node, LBG press release
 * 2026-01-20; six-UK-bank shared-ledger sterling, UK Finance; GENIUS Act).
 * Everest Group (30+ case studies): insurers must partner with blockchain
 * ecosystems to scale beyond proofs of concept — our thesis, sourced.
 * Market figures are research-house forecasts that diverge ~4× by 2033/34
 * — one shown, the spread named, both sourced. Lloyds Bank plc ≠ Lloyd's
 * of London — never conflate in copy or speech. */

const TRIED_ROWS: { name: string; detail: string }[] = [
  {
    name: "B3i",
    detail: "20+ insurers & reinsurers · $16M raised '19 · insolvent '22",
  },
  {
    name: "AXA fizzy",
    detail: "parametric flight delay on Ethereum, '17 · closed '19",
  },
  {
    name: "Marsh Risk Exchange",
    detail: "placements, documents, invoices on chain · '19",
  },
  {
    name: "BUILDINGBLOCK",
    detail: "multinational property on a consortium ledger",
  },
];

const CHANGED_ROWS: { name: string; detail: string }[] = [
  {
    name: "public rails settle real money",
    detail:
      "Lloyds Bank bought a gilt with tokenised deposits on a public chain — its own validator node (Jan '26)",
  },
  {
    name: "sterling pilots on shared ledgers",
    detail: "six UK banks, UK Finance Great British Tokenised Deposits",
  },
  {
    name: "the rules exist",
    detail: "GENIUS Act law (US '25) · MiCA live (EU)",
  },
  {
    name: "pilots became operations",
    detail:
      "parametric payouts automatic; Everest Group: insurers must partner with blockchain ecosystems to scale",
  },
];

export const AppendixIndustrySlide: FC = () => {
  return (
    <SlideFrame
      kicker="appendix — the industry"
      headline="Insurance has been trying since 2017. The money finally moved."
    >
      <div className="max-w-[76ch] text-ink [font:var(--riprap-title-md)]">
        The first wave built private consortium ledgers and died. What changed is not insurance —
        the money itself now settles on public rails.
      </div>
      <div className="deck-narrow:flex-col flex w-full items-start gap-12">
        <div className="flex flex-1 flex-col gap-4">
          <div className="uppercase text-muted [font:var(--riprap-mono-label)] [letter-spacing:var(--riprap-tracking-stamp)]">
            the first wave · private ledgers · 2017–22
          </div>
          {TRIED_ROWS.map((r) => (
            <div key={r.name} className="flex flex-col gap-1 border-t border-hairline pt-3">
              <span className="text-ink [font:var(--riprap-title-sm)]">{r.name}</span>
              <span className="text-muted [font:var(--riprap-body-sm)]">{r.detail}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-1 flex-col gap-4">
          <div className="uppercase text-muted [font:var(--riprap-mono-label)] [letter-spacing:var(--riprap-tracking-stamp)]">
            what changed · public rails · 2025–26
          </div>
          {CHANGED_ROWS.map((r) => (
            <div key={r.name} className="flex flex-col gap-1 border-t border-hairline pt-3">
              <span className="text-ink [font:var(--riprap-title-sm)]">{r.name}</span>
              <span className="text-muted [font:var(--riprap-body-sm)]">{r.detail}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex w-full items-baseline gap-6 border-t border-hairline pt-3" data-num>
        <span className="text-accent [font:var(--riprap-mono-number)]">$2.96B &rarr; ~$96B</span>
        <span className="flex-1 text-muted [font:var(--riprap-body-sm)]">
          blockchain-in-insurance market, 2025 &rarr; 2034 — research-house forecasts diverge
          (~$22.5B by 2033 elsewhere); treat as direction, not size
        </span>
        <span className="text-muted-soft [font:var(--riprap-mono-label)]">
          Fortune Business Insights &rsquo;25
        </span>
      </div>
    </SlideFrame>
  );
};

/* A2 — appendix: the destination has a buyer (added 2026-10-22; not yet
 * mirrored in meta/PITCH.md) — Lloyd's Lab Cohort 17 (2026) runs a wildcard
 * theme soliciting exactly our endpoint, by name. Composability law holds:
 * pools-stack language stays modal ("can") — the 5–10-year horizon is the
 * venue where horizon-talk is the expected register. Lloyd's of London
 * (lloyds.com, the market) — never Lloyds Bank (lloydsbank.com). */

const LLOYDS_QUOTES = [
  {
    text: "Next-generation Alternative Risk Transfer: highly sophisticated financial systems connecting institutional capital directly with insurance risks.",
    src: "Lloyd's Lab · Cohort 17 themes · 2026",
  },
  {
    text: "attract private equity and alternative capital into the Lloyd's ecosystem",
    src: "same theme · named market gap",
  },
];

const LLOYDS_MAPPING = [
  {
    v: "first loss",
    label: "the members' pool — members' money, members' jurors, no company",
  },
  {
    v: "the tail",
    label: "syndicate capital can stake behind pools — the backstop layer Lloyd's is asking for",
  },
  {
    v: "pools stack",
    label: "one pool can cover another — reinsurance and tranching as protocol properties",
  },
];

export const AppendixLloydsSlide: FC = () => {
  return (
    <SlideFrame
      kicker="appendix — the destination"
      headline="Lloyd&rsquo;s itself is asking for this."
    >
      <div className="flex w-full flex-col gap-4">
        {LLOYDS_QUOTES.map((q) => (
          <blockquote key={q.src} className="flex flex-col gap-2 border-l-2 border-accent pl-6">
            <p className="max-w-[72ch] text-ink [font:var(--riprap-title-md)]">
              &ldquo;{q.text}&rdquo;
            </p>
            <cite className="text-muted-soft [font:var(--riprap-mono-label)]">{q.src}</cite>
          </blockquote>
        ))}
      </div>
      <div className="flex w-full flex-col gap-4" data-num>
        <div className="uppercase text-muted [font:var(--riprap-mono-label)] [letter-spacing:var(--riprap-tracking-stamp)]">
          the mapping — our rails, their capital
        </div>
        {LLOYDS_MAPPING.map((r) => (
          <div key={r.v} className="flex items-baseline gap-8 border-t border-hairline pt-3">
            <span className="w-[14ch] text-right text-accent [font:var(--riprap-mono-number)]">
              {r.v}
            </span>
            <span className="flex-1 text-ink [font:var(--riprap-title-sm)]">{r.label}</span>
          </div>
        ))}
        <div className="pt-2 text-muted-soft [font:var(--riprap-mono-label)]">
          5&ndash;10-year horizon, their words &middot; Lloyd&rsquo;s of London, the insurance
          market &middot; not Lloyds Bank
        </div>
      </div>
    </SlideFrame>
  );
};

///* A1 — appendix (the destination stack the vision slide carried pre-re-stage) */
//
///** The five machines on-chain cover needs, one per step, ordinals matching
// * the plates (n ↔ tile step): custody, adjudication, recurrence, reserve
// * capital, reinsurance. Copy per meta/PITCH.md §12 (destination
// * vocabulary). Presented as the vision slide before the 2026-09-18
// * re-stage; kept as the deck's reference ending. */
//const VISION_STEPS = [
//  {
//    id: "gather",
//    step: "01",
//    head: "money gathers",
//    body: (
//      <>
//        the pool is <span className="font-extrabold text-white/80">a program, not a company</span> —
//        it holds usdc and nothing else. members chip in, one pool per defined risk.
//      </>
//    ),
//    label: "money gathers",
//    Glyph: Gather,
//  },
//  {
//    id: "rule",
//    step: "02",
//    head: "peers decide",
//    body: (
//      <>
//        claims are judged by staked members of the same pool — drawn at random, sealed votes,
//        appeals double the jury. adjudication by{" "}
//        <span className="font-extrabold text-white/80">accord</span>, honestly an arbitration
//        oracle.
//      </>
//    ),
//    label: "peers decide",
//    Glyph: Rule,
//  },
//  {
//    id: "renew",
//    step: "03",
//    head: "cover renews",
//    body: (
//      <>
//        contributions recur through the pull payments rail. We've alreday built that with{" "}
//        <span className="font-extrabold text-white/80"> tributary.so</span>.
//      </>
//    ),
//    label: "cover renews",
//    Glyph: Renew,
//  },
//  {
//    id: "backstop",
//    step: "04",
//    head: "a backstop grows",
//    body: (
//      <>
//        <span className="font-extrabold text-white/80">external risk capital</span> stakes a reserve
//        beneath the pool and earns a rule-set share of its surplus.
//      </>
//    ),
//    label: "a backstop grows",
//    Glyph: Backstop,
//  },
//  {
//    id: "stack",
//    step: "05",
//    head: "pools cover pools",
//    body: (
//      <>
//        mutuals cover each other: first loss below, the tail above.{" "}
//        <span className="font-extrabold text-white/80">reinsurance and tranching</span>.
//      </>
//    ),
//    label: "pools cover pools",
//    Glyph: Stack,
//  },
//] as const;
//
//const AppendixSlide: FC = () => {
//  const frame = useSlideFrame();
//  return (
//    <SlideFrame kicker="appendix" headline="the destination stack">
//      <div className="flex w-full flex-col gap-8">
//        <div
//          className="max-w-[62ch] text-ink [font:var(--riprap-title-md)]"
//          style={rise(frame, 16)}
//        >
//          An open protocol for insurance, on chain.
//        </div>
//
//        <div style={rise(frame, 32)}>
//          <ol
//            data-slot="expansion-strip"
//            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
//          >
//            {VISION_STEPS.map((tile) => (
//              <ExpansionTile key={tile.step} {...tile} />
//            ))}
//          </ol>
//        </div>
//
//        {/* same grid template as the strip — column i elaborates plate i */}
//        <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
//          {VISION_STEPS.map((s, i) => (
//            <div
//              key={s.step}
//              className="flex flex-col gap-2 border-t border-hairline pt-4"
//              style={rise(frame, 52 + i * 12)}
//            >
//              <div className="text-muted [font:var(--riprap-body-sm)]">{s.body}</div>
//            </div>
//          ))}
//        </div>
//      </div>
//    </SlideFrame>
//  );
//};

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
      "10s. Riprap — insurance, finally programmable. Pitched for Colosseum's World's Fair hackathon. Status honesty: pool program built, arbitration live on devnet, the event-mutual orchestrator (hanse) in build, payment rail live on mainnet.",
    component: TitleSlide,
  },
  {
    id: "problem",
    label: "the problem",
    notes:
      "30s. The frame: traditional insurance is a slow, expensive monolith. Two numbers, side by side: ~26¢ of every US premium dollar is spent before a claim is paid (Verisk/APCIA '25) — the fixed-cost back office — while investors earn 11.6–18% interest on risk capital. At that cost floor, microinsurance is often infeasible.",
    component: ProblemSlide,
  },
  {
    id: "intro",
    label: "introduction — what an insurance does",
    notes:
      "30s. One table, the same grammar as the vision receipts: the four moves label the rows; Mutual checks the first three — people pool money, claims get adjudicated by members, pool pays approved claims; Insurance checks all four — the fourth being risk capital earns yield, offers backstop. One missing check mark is the whole difference.",
    component: IntroSlide,
  },
  {
    id: "vision",
    label: "the vision",
    notes:
      "25s. Why the world is ripe for internet insurance. Call a smart contract what it is: business logic that runs 24/7/365 — autonomous, permissionless, transparent. No surprise defi trading works great on-chain — it is well-understood business logic. You know what else is well-understood business logic? Insurance. Then the table, top to bottom: the first two rows are the business — tradinsure pools money and decides payouts, and so does web3 insure; every row below is the rails — transparent (the balance is a public number — solvency provable, not asserted), settles instantly (the point is not speed-as-UX: every settlement intermediary — premium finance, custodian, claims desk, paying bank — collapses to one transfer; no float custody between member and reserve), global & 24/7/365, permissionless (anyone with a wallet), composable (pools stack into tranched capital) — web3 only. Overhead dies on the way: the ~26¢-per-dollar back office becomes transaction fees. The five-machine destination stack moved to the appendix — walk it there if asked. Segue: so why doesn't on-chain insurance exist today — the problem, next slide.",
    component: VisionSlide,
  },
  {
    id: "now",
    label: "the now",
    notes:
      "25s. Why now — three pieces landing together. First: settlement — insurance has one hard requirement: premiums and claims must be denominated and paid in an asset people actually want to hold; SOL's volatility against the underlying risk never qualified. The receipts that the money already moved (re-staged 2026-10-22, replacing the $16.3B supply stat): Lloyds Bank bought a gilt with tokenised deposits on a PUBLIC blockchain, running its own validator node (LBG press release 2026-01-20) — one fact that retires the 'regulated institutions don't touch public rails' objection; six UK banks pilot shared-ledger sterling (UK Finance, Great British Tokenised Deposits); GENIUS Act federal law since July 2025; Visa settling USDC since late 2025. Name discipline: Lloyds Bank, the bank — a different institution from Lloyd's of London; never conflate. No FX conversion, no correspondent banking, no T+2 — the chain becomes the payment rail for the insurance contract. Second: recurring premiums need pull payments — Tributary, live on mainnet, built by us. Third: permissionless, decentralized claims adjudication — Accord, live, built by us. Land: two of the three prerequisites are already ours — settlement arrived on its own, the rails underneath are built. Segue: the pilot — where the machine first runs for real, next slide. Full industry timeline — the 2017–22 private-ledger attempts and what changed — appendix A1.",
    component: NowSlide,
  },
  {
    id: "product",
    label: "the product",
    notes:
      "35s. One mutual, one risk, a lifetime of its choosing — event pools expire by clock; open-ended mutuals liquidate when members choose. Walk the lifecycle strip: join, gather, rule, claim. Three laws: two exit doors (no discretionary signer); members judge members (Accord — useaccord.xyz — staked jurors, sealed votes, appeals, slashing); an enforced end either way. Status row verbatim if asked: pool built, arbitration on devnet, hanse in build, Tributary on mainnet. Audits gate mainnet capital — that is what the raise funds first.",
    component: ProductSlide,
  },
  {
    id: "business",
    label: "the business",
    notes:
      "25s. Revenue-first ladder: 0% take on the pilot (it exists to publish numbers); take-rate on surplus switched on with the second pool — doubles as the organizer revenue-share; operator fees for flagship deployments; at the destination, a rail share on mutuals we do not operate. USDC end to end, no product token. The raise carries a token warrant over staked reserve capital — protection yield — bounded to a fixed share of any future supply with terms published before the round opens; the preferred end state is token-only via MetaDAO — value to the DAO, not the cap table. The warrant is the term we negotiate hardest.",
    component: BusinessSlide,
  },
  {
    id: "launch",
    label: "the pilot",
    notes:
      "35s. The pilot, re-staged 2026-10-07: aid and bounties at Breakpoint. The pivot in one breath — we swapped slow risk pools for fast crowdfunded bounties on the same mechanics, so every pilot, silly or serious, turns into a lesson that sharpens the engine before real-world insurance. Two classes on one engine: mutuals where members cover each other — Blade Pool the serious anchor (capped payouts, bounded lifetime, one venue), Chairmageddon, NGMI Hairline and Coffee Apocalypse the silly-but-adjudicable ones — and bounties that pay for confirmed acts — OnlyFriends' per-introduction caps, the hot-drink runs for Raj/Lily/Toly (one mechanic, three pools), Mert of the Year. Numbers are the §5 policy/terms tables verbatim; the landing's mutuals directory carries the live batch. Venue unchanged: Olympia London, 15–17 Nov 2026, 8,000+ attendees.",
    component: LaunchSlide,
  },
  // {
  //   id: "ask",
  //   label: "the ask",
  //   notes:
  //     "30s. $700k on a post-money SAFE plus a bounded token warrant; range $600–800k; opening cap $7M post — 10%; 18 months; primary milestone organizer-initiated pools. The narrative: capital → de-risk → prove → unlock — security, product, proof, legal, growth. If asked what $100k gets an angel to: from an audited working product and an operational pilot to a repeatable network of organizer-initiated pools. Angel-ladder construction stays private.",
  //   component: AskSlide,
  // },
  {
    id: "team",
    label: "the team",
    notes:
      "20s. The headline is the track record: early for DEX in 2014 (BitShares), tokenomics in 2016 (MakerDAO whitepaper review, Steemit), prediction markets in 2018 (exbet), scalar betting in 2022 — and early again today, this time for insurance. Then the humans and the AI teammate: Left: Dr.-Ing. Fabian Schuh — full-time crypto since 2014, first person hired and paid directly by a blockchain, built the BitShares escrow and worker-proposal treasury, Solana Security #2. Middle: Dr. Stefan Schießl — applied math PhD; chaos quantified, risk priced, assumptions audited, optimism stress-tested, tail risk handled. Right: Corinna — BD, social, analytics, on shift 24/7. The wall is ambience — twenty years of shipping, on-chain since 2014. Gesture once, don't read it.",
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
    id: "appendix-qa",
    label: "appendix — the hard questions",
    notes:
      "15s. The appendix opens with the four questions every IC asks, one card each — problem on top, our answer on the plate. Legal: the mutual is deliberately limited in scope and time to stay outside UK insurance regulation; scope widens step by step as we progress. Adjudication: the company risk, owned — parameters are case by case and defined for the pilot; the metric set publishes from Blade Pool onward. Blade Pool: the cheapest place to find adjudication failures — payouts capped $1k–4k, stakes $10–40, one venue, a bounded lifetime. Team: started solo, became a real business — none of it without mtnDAO, and on-chain insurance has been on our minds for half a decade.",
    component: AppendixQASlide,
  },
  {
    id: "appendix-industry",
    label: "appendix — the industry",
    notes:
      "Reference, not presented (added 2026-10-22). The receipts that it is time: insurance has tried on-chain since 2017 and the first wave died on private ledgers — B3i, 20+ insurers and reinsurers, $16M raised '19, insolvent July '22 (Insurance Journal); AXA fizzy, parametric flight delay on Ethereum, launched '17, closed '19 citing low market appetite and weak distribution (Insurance Post); Marsh Risk Exchange '19; BUILDINGBLOCK. What changed is not insurance — the money moved to public rails: Lloyds Bank's tokenised-deposit gilt purchase with its own validator node (Jan '26), six-UK-bank shared-ledger sterling, GENIUS Act law. Everest Group, 30+ case studies: insurers will need to partner with blockchain ecosystems to scale beyond proofs of concept — our thesis, sourced. The bank's own public-over-private argument is our posture verbatim: mass adoption with confidentiality — solvency public by default, evidence encrypted by design. Market figure shown with its spread ($2.96B 2025 → ~$96B 2034, Fortune Business Insights; other houses ~$22.5B by 2033) — direction, not size. If asked why the first wave failed where we should not: private ledgers reproduced the institution (membership, permissioning, no money of its own on the rail) — a faster bank, not a new one; we run on public rails where the money already is. Lloyds Bank plc ≠ Lloyd's of London.",
    component: AppendixIndustrySlide,
  },
  {
    id: "appendix-lloyds",
    label: "appendix — the destination",
    notes:
      "Reference, not presented (added 2026-10-22). The destination has a named institutional buyer: Lloyd's Lab Cohort 17 (2026) runs a wildcard 'experimental innovation' theme soliciting, verbatim, next-generation Alternative Risk Transfer — 'highly sophisticated financial systems connecting institutional capital directly with insurance risks' — with the named market gap of attracting private equity and alternative capital into the Lloyd's ecosystem. The mapping, spoken modal (composability law — pools can stack, ships in order): the members' pool is the first loss, syndicate capital can stake behind pools as the tail, one pool can cover another. Their stated horizon is 5–10 years — horizon-talk is the expected register there, ours too. Lloyd's of London, the insurance market (lloyds.com) — never Lloyds Bank (lloydsbank.com); if the namesake comes up, it is an icebreaker, never a hint of affiliation.",
    component: AppendixLloydsSlide,
  },
  // {
  //   id: "appendix",
  //   label: "appendix — the destination",
  //   notes:
  //     "Reference, not presented — the stack the vision slide carried before the 2026-09-18 re-stage. The five machines on-chain cover needs, one per plate: 01 money gathers — programmatic custody: the pool is a program, not a company, it holds USDC and nothing else; 02 peers decide — adjudication: staked members of the same pool, drawn at random, sealed votes, appeals that double the jury — Accord, honestly an arbitration oracle; 03 cover renews — recurring contributions on the payment rail, live on mainnet today; 04 a backstop grows — external risk capital staking the reserve for a rule-set share of surplus; 05 pools cover pools — first loss below, tail above: reinsurance and tranching as protocol properties. Custody, adjudication, recurrence, reserve capital, reinsurance — everything an insurer needs, none of it a company. The machines already exist — payment rail live on mainnet, arbitration live on devnet, pool program built.",
  //   component: AppendixSlide,
  // },
  {
    id: "market",
    label: "the market",
    notes:
      "35s. The story first, then the numbers: millions of communities are too small, too geographically specific, too short-duration, or too low-premium for conventional insurance economics — a $20, 3-day, single-peril cover is sub-economic by construction when ~26¢ of every US P&C premium dollar is spent before a claim is paid (Verisk/APCIA '25). We are building the infrastructure that lets those groups create their own risk pools. Then read the evidence, do not editorialize: $424B protection gap (Swiss Re '25); 344M covered, 88% uncovered (MiN '24); ~26¢ per premium dollar (Verisk '25); $1.61T mutual premiums — the same behavior, formalized (ICMIF '24). If asked: $136B alternative capital gated at $200k QIB tickets (Aon '25); on-chain, $3.4B stolen per year against a $104M cover sector (Chainalysis, DeFiLlama); market scan — Nexus Mutual $5.7M cover fees '25, $2.7M raised ever, $1B+ purchased; OpenCover $4.6M seed '22–23, $141.6M protected '25. Close: one machine addresses every row — a mutual becomes a transaction, surplus returns by rule, the back office is the chain.",
    component: MarketSlide,
  },
  {
    id: "Competitors",
    label: "Competitors",
    notes:
      "30s. Gesture once, don't read it: the 2020–22 graveyard, one named failure per project — Neptune Mutual (upfront lump sum; token-vote claims), Cover Protocol (exploited itself), Solace (shared idle pool), OpenCover (web3 portfolio cover), Unslashed (no float income), InsurAce (twenty thin chains), Bridge Mutual (farmed, not mutual), Risk Harbor (wLUNA collateral). Same lesson at company scale: the rails were never the whole machine — custody without adjudication, one pool, or permissioning is just a slower bank. If asked, the mutual-history backing: pooled protection is the oldest fix — the formal version is $1.61T and winning (ICMIF '24); the informal version dies of opacity, disputes, and scale, which is why the friendly societies became licensed mutuals — formalization fixed trust at the price of the charter. The solvency and jurisdiction pains stay in Q&A — the vision table carries those ✗. Land: the behavior is universal, the on-ramp does not exist. Segue: the product — the rails that remove each ✗, next slide.",
    component: IncumbantsProblemSlide,
  },
];
