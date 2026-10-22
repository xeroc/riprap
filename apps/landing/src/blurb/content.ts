// The blurb page copy. Founder call (2026-09-23): copy lives inline here
// for now — the meta/marketing/03-website-copy doc lands in its own vault
// commit; until then every string's provenance rides in the comments.
// Positioning pass (2026-10-06): cover-led hierarchy — pooled cover is
// the one market, bounties ride as a clause, insurance is the roadmap
// destination (risk capital in, yield out). Source: brand-story.md +
// messaging-guide.md § Payout-Pool Pass.
// Cost/yield pass (2026-10-11, founder call): blurbs + email lead with
// the two numbers — 25% cost load, 18% privileged-LP yield (founder-
// supplied, deck sources) — and the DeFi-both-directions thesis (yield
// open to everyone; pools using AMMs, staking, stacked re-insurance —
// modal "can" per the composability law); motto: "Insurance, Finally
// Programmable".
// Register law: meta/marketing/07-brand-assets/messaging-guide.md — line
// set, banned words, numbers with sources. Pre-round law (2026-09-23
// founder call): no round numbers appear on this page or in the email —
// "terms and deck on request" only.

/** Page intro — what this page is and why it is unlisted. */
export const INTRO =
  "Everything on this page is meant to be copied: an explainer when you write about riprap, the logo files, and an email that introduces us to someone you know.";

/** Status line — the ask without numbers (pre-round law). */
export const STATUS = "raising a pre-seed now · terms and deck on request";

/** One-liner for chats — purpose-pool line (purpose-pool pass,
 * 2026-10-20) + domain. */
export const ONE_LINE = "riprap — purpose pools on Solana, settled by peers. riprap.xyz";

/** Short blurb — cost/yield pass (2026-10-11, founder call): the two
 * numbers (25% cost load, 18% privileged-LP yield — founder-supplied,
 * deck sources) + mutual-lineage mechanism + DeFi-both-directions +
 * motto close. First batch = bound facts (Breakpoint, November, London;
 * nine pools = pools/data.ts POOLS) + founder. */
export const SHORT_BLURB = `Over 25% of every insurance dollar vanishes before a request is paid; meanwhile, only privileged LPs earn up to 18% yield.

riprap solves this, makes insurances permissionless, transparent and more competitive by putting the insurances business logic into a smart contract on solana.

Today it runs purpose pools on Solana: any group can start one — chip in under a purpose you set, drawn peers decide every payout against it, the money stays the group's. The first market is the original insurance — mutual risk pools.

Insurance, Finally Programmable.

Pilot: nine pools @ Breakpoint 2026, London, this November.

Built by Dr.-Ing. Fabian Schuh (full-time crypto since 2014) with Corinna, an AI agent on shift 24/7.

riprap.xyz`;

/** Standard blurb — cost/yield pass (2026-10-11, founder call): the two
 * numbers (25% / 18%, founder-supplied, deck sources) + unfairness gloss
 * + mutual-lineage mechanism + how-it-works + bounty clause (payout-pool
 * pass, 2026-10-06) + DeFi-both-directions roadmap (modal: can —
 * composability law) + motto close + team + first batch. */
export const STANDARD_BLURB = `Over 25% of every insurance dollar vanishes before a single request is paid. Meanwhile, privileged LPs earn up to 18% on the same risk — insurance is expensive for the people who buy it and closed to the people who would fund it.

riprap solves this, makes insurances permissionless, transparent and more competitive by putting the insurances business logic into a smart contract on solana.

riprap is purpose pools on Solana: any group can start one — chip in under a purpose you set, drawn peers decide every payout against it, the money stays the group's. The purpose never changes; a new purpose is a new pool. The first market is the original insurance — mutual risk pools, humanity's oldest protection.

How it works:

 - Members pay a fixed fee into a pool.
 - Incidents are judged by jurors staked from the pool itself.
 - Verdicts run on Accord, a Schelling-point arbitration protocol.
 - Approved requests pay out of the pool.

Insurance, Finally Programmable.

Built by Dr.-Ing. Fabian Schuh — full-time crypto since 2014 — with Corinna, an AI agent on shift 24/7.

Pilot: nine pools @ Breakpoint 2026, Olympia, London, 15–17 Nov. riprap.xyz`;

/** Forwardable email — written in the introducer's voice ("I want to
 * introduce you to Fabian…"), plain text, no links except the blurb page.
 * Cost/yield pass (2026-10-11): opens on the two numbers + motto subject.
 * Founder rows and rails verbatim from the deck team/now slides; round
 * terms deliberately absent (pre-round law). */
export const EMAIL_TO = "[investor name]";

export const EMAIL_SUBJECT = "Intro: riprap — Insurance, Finally Programmable.";

export const EMAIL_BODY = `Hi [name],

Meet Fabian. He's building riprap — Insurance, Finally Programmable.

Two numbers: over 25% of every insurance dollar vanishes before a single request is paid, while privileged LPs earn up to 18% yield. Insurance is expensive for the people who buy it and closed to the people who would fund it.

riprap to open both sides. At first we provide the original insurance — mutual risk pools, humanity's oldest protection — put on-chain: peers chip in, drawn peers settle requests. First market: the risks insurers can't sell — too small, too new, too narrow.

They already built the rails this runs on:

 - Pull payments for recurring premiums — tributary.so
 - On-chain request adjudication — useaccord.xyz

Later, they will allow risk capital in and connect DeFi for investors to earn a yield. Permissionlessly, Transparent, Fair. Not just privileged LPs. And pools themselves can use DeFi primitives.

A quarter of the world's cover already runs on the mutual structure ($1.61T, ICMIF 2024 data).

First pools go live at Breakpoint, Solana's flagship conference — 15–17 Nov 2026, London.

Why Fabian: full-time in crypto since 2014. He was the first hire ever paid directly by a blockchain, and he built BitShares' escrow and worker-proposal treasury, adviced MakerDAO in their very early days and has an engineering PhD. He ships with Corinna, an AI agent on shift 24/7.

He's raising a pre-seed now — deck and terms on request.

Worth 20 minutes? → https://riprap.xyz/#/blurb`;

/** The full email as one clipboard string — subject rides along so the
 * introducer can paste it into the compose window's subject field. */
export const EMAIL_FULL = `Subject: ${EMAIL_SUBJECT}\n\n${EMAIL_BODY}`;

/** Team — from the seed deck team slide
 * (apps/pitches/2026-11-pitch-seed-raise/src/deck/slides.tsx); founder rows edited by
 * Fabian 2026-09-23 (Superteam member, split contact rows). */
export interface Persona {
  img: string;
  alt: string;
  caption: string;
  rows: string[];
}

export const PERSONAS: Persona[] = [
  {
    img: "/people/fabian.webp",
    alt: "Dr.-Ing. Fabian Schuh",
    caption: "Dr.-Ing. Fabian Schuh · founder",
    rows: [
      "Dr.-Ing., engineering",
      "Superteam member",
      "full-time crypto since 2014",
      "fabian@chainsquad.com",
      "x.com/@xeroc · t.me/xeroc",
    ],
  },
  {
    img: "/people/corinna.webp",
    alt: "Corinna — ai agent",
    caption: "Corinna · ai agent",
    rows: [
      "centuries of experience",
      "the unrelenting",
      "number cruncher",
      "devils advocate",
      "on shift 24/7",
    ],
  },
];

/** Track record — the deck's kudos wall, all 22 lines verbatim
 * (apps/pitches/2026-11-pitch-seed-raise/src/deck/slides.tsx, 2026-09-23). */
export const KUDOS = [
  "Accord — on-chain arbitration · live",
  "Colosseum Honorable Mentions",
  "Tributary — Solana payment rail · mainnet",
  "Solana Foundation grant · 2026",
  "riprap — pool program · built",
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

/** Brand kit — files served from /brand/; mark/wordmark from the brand
 * vault (meta/marketing/07-brand-assets/logo/), lockup/avatar generated
 * by apps/landing/scripts/generate-brand-assets.mts. */
export interface BrandAsset {
  id: string;
  label: string;
  note: string;
  svg: string;
  png?: string;
}

export const BRAND_ASSETS: BrandAsset[] = [
  {
    id: "logomark",
    label: "logomark",
    note: "the stone ring — the settled pool, one slot open",
    svg: "/brand/mark.svg",
    png: "/brand/mark.png",
  },
  {
    id: "wordmark",
    label: "wordmark",
    note: '"riprap", lowercase — never re-typeset into other words',
    svg: "/brand/wordmark.svg",
    png: "/brand/wordmark.png",
  },
  {
    id: "lockup",
    label: "lockup",
    note: "mark + wordmark, horizontal (LogoLockup ratios)",
    svg: "/brand/lockup-horizontal.svg",
    png: "/brand/lockup-horizontal.png",
  },
  {
    id: "avatar",
    label: "avatar",
    note: "the mark, tight avatar crop",
    svg: "/brand/avatar.svg",
    png: "/brand/avatar.png",
  },
];

/** Contact — the deck's public address; X handles are bound facts
 * (messaging-guide: @riprapxyz; founder: @xeroc). */
export const CONTACT_EMAIL = "fabian@chainsquad.com";
export const X_RIPRAP_URL = "https://x.com/riprapxyz";
export const X_FABIAN_URL = "https://x.com/xer0c";

/** Brand story essentials — the name's origin and the mark's anatomy.
 * Verbatim-shaded from meta/marketing/07-brand-assets/brand-story.md
 * ("The name is the architecture" paragraph) and DESIGN.md § Decorative
 * Depth (the ring). */
export const BRAND_STORY =
  "riprap is the armor on the face of a breakwater — thousands of loose stones, no mortar, no cement. No wall to breach, because there is no wall: stones leaning on each other.";

export const RING_ANATOMY =
  "The mark is an open ring: seven grey stones, one slot deliberately empty (open membership), one harbor-blue stone settled beside the gap — the newest member.";

/** Brand colors — the working palette, values verbatim from
 * packages/ui/src/tokens.css and the baked hex in the logo SVGs. Only the
 * most-used set (DESIGN.md key characteristics); the full token scale is
 * internal. The hex strings are data — the palette is the content here,
 * like the baked hex in the logo files. */
export interface BrandColor {
  name: string;
  hex: string;
  note?: string;
}

export interface BrandColorGroup {
  group: string;
  colors: BrandColor[];
}

export const BRAND_COLORS: BrandColorGroup[] = [
  {
    group: "logo",
    colors: [
      {
        name: "warm white",
        hex: "#F2EFE8",
        note: "the wordmark — also display and primary text",
      },
      { name: "stone", hex: "#A7ADB3", note: "the ring's seven grey stones" },
      {
        name: "harbor-blue",
        hex: "#3E7CA6",
        note: "the newest-member stone — the only accent",
      },
    ],
  },
  {
    group: "ground & surfaces",
    colors: [
      { name: "ground", hex: "#0C0E10", note: "page floor, never pure black" },
      { name: "ground soft", hex: "#101317", note: "alternating band" },
      { name: "surface card", hex: "#17191D", note: "cards on dark" },
    ],
  },
  {
    group: "text",
    colors: [
      { name: "body", hex: "#C9CDD1", note: "running text on dark" },
      { name: "muted", hex: "#8A9096", note: "subtitles, labels" },
    ],
  },
  {
    group: "hairlines",
    colors: [{ name: "hairline", hex: "#2A2E33", note: "the 1px rule" }],
  },
];

/** Brand usage law — DESIGN.md § Do / § Don't, condensed. */
export const BRAND_USAGE =
  "Harbor-blue is an accent — the ring's newest-member stone, links, stamps; never a button fill or a background. No gradients, no shadows, no second accent. Sharp geometry (0px radius), 1px hairlines, settle-not-slide motion.";

/** Type — DESIGN.md § Typography. Both faces are SIL OFL. */
export interface BrandType {
  name: string;
  role: string;
}

export const BRAND_TYPE: BrandType[] = [
  { name: "Space Grotesk", role: "display and body — 700 display, 400/500 body" },
  { name: "JetBrains Mono", role: "every number, stamp, label, and address" },
];

/** The explainers — short videos, talks, and behind-the-scenes posts
 * from the founder's X build log, ordered by what they explain: the
 * mutual, the verdict layer, the court, the full pitch — then how the
 * explainers got made. Tweet bodies are verbatim quotes pulled from
 * x.com/xer0c via the twitterapi MCP on 2026-09-28 (whitepaper entry via
 * fxtwitter 2026-10-15); each entry's comment carries its permalink. The
 * trailing media t.co short link is stripped
 * from each body exactly as x.com renders it (the poster frame below the
 * text IS that link). Counts are as of each entry's fetch date and will
 * drift. Poster frames are served locally from /blurb/. */
export interface ExplainerTweet {
  /** mono kicker — the ordinal and what this tweet explains */
  kicker: string;
  /** one line on what the reader learns from it */
  note: string;
  /** tweet body, verbatim (media t.co stripped) */
  text: string;
  /** x.com-format date stamp */
  date: string;
  /** engagement stamp beside the date */
  meta: string;
  /** local poster-frame path under /blurb/ */
  media: string;
  /** alt text describing the frame */
  mediaAlt: string;
  /** local mp4 of the tweet's native video (720p variant) */
  video?: string;
  /** x.com permalink */
  url: string;
  /** companion link when the real content sits in the thread (e.g. YouTube) */
  youtubeUrl?: string;
  /** privacy-enhanced embed of the YouTube talk, when youtubeUrl is set */
  youtubeEmbed?: string;
}

export const EXPLAINERS: ExplainerTweet[] = [
  {
    // x.com/xer0c/status/2092072543876440364 — pinned; HANSE 30s explainer
    kicker: "01 · the mutual",
    note: "What pooled protection is, how much of the world already runs on it, and why on-chain mutuals cover the wrong risk.",
    text: "Pools are the oldest form of pooled protection on earth.\n\nA quarter of the world's cover ($1.6T across 4,700+ societies, ICMIF24) runs on this structure\n\nOn-chain, the sector holds ~$104M. Why? Because they cover the wrong thing: web3 losses\n\nWE are building HANSE to fix this.",
    date: "Aug 25, 2026",
    meta: "1,046 views · 13 likes",
    media: "/blurb/hanse-mutuals.jpg",
    mediaAlt: "Poster frame of the 30-second HANSE mutuals explainer video",
    video: "/blurb/hanse-mutuals.mp4",
    url: "https://x.com/xer0c/status/2092072543876440364",
  },
  {
    // x.com/xer0c/status/2092273036791816595 — ACCORD 30s explainer
    kicker: "02 · the verdict layer",
    note: "How a request gets decided: Schelling points instead of a multisig or arbitrator.",
    text: "30 seconds on ACCORD.\n\nIt's a dispute resolution system built on Schelling points.\n\nNo Multisig. No arbitrators. Just aligned incentives that nudge everyone toward the obvious fair outcome.\n\nWhat becomes possible? Watch till the end.\n\nExplainer 🎥👇",
    date: "Aug 25, 2026",
    meta: "210 views · 5 likes",
    media: "/blurb/accord-verdict-30s.jpg",
    mediaAlt: "Poster frame of the 30-second ACCORD dispute resolution explainer video",
    video: "/blurb/accord-verdict-30s.mp4",
    url: "https://x.com/xer0c/status/2092273036791816595",
  },
  {
    // x.com/xer0c/status/2092474752799813980 — Schelling court 30s
    // explainer; text verbatim incl. the missing apostrophe in "ACCORDs"
    kicker: "03 · the court",
    note: "The juror mechanics — commit, reveal, majority — and why converging on the fair outcome pays.",
    text: "30 seconds on ACCORDs Schelling Court.\n\nNo Multisig. No lawyers.\n\nJust game theory. Jurors converge on the obvious fair outcome because it's in everyone's interest to tell the truth.\n\nWhat becomes possible? Dispute resolution that's fast, cheap, and composable\n\nWatch the explainer 🎥👇",
    date: "Aug 26, 2026",
    meta: "162 views · 1 like",
    media: "/blurb/schelling-court-30s.jpg",
    mediaAlt: "Poster frame of the 30-second Schelling Court explainer video",
    video: "/blurb/schelling-court-30s.mp4",
    url: "https://x.com/xer0c/status/2092474752799813980",
  },
  {
    // x.com/xer0c/status/2090243673422475386 — rough-cut feedback ask
    kicker: "04 · the rough cut",
    note: "The first 30-second attempt, posted for feedback before the finished cuts existed.",
    text: "What’s the secret to a perfect explainer video? 🧠\n\nToday’s  grind at @mtndao is all about breaking down @Accord. Would love your  feedback on the rough cut. What makes you stop scrolling and actually  watch?",
    date: "Aug 20, 2026",
    meta: "413 views · 3 likes",
    media: "/blurb/explainer-rough-cut.jpg",
    mediaAlt: "Poster frame of the rough-cut explainer video",
    video: "/blurb/explainer-rough-cut.mp4",
    url: "https://x.com/xer0c/status/2090243673422475386",
  },
  {
    // x.com/xer0c/status/2090336880126726271 — day of shooting explainers
    kicker: "05 · the making of",
    note: "A day at mtnDAO turning the rough cut into the finished explainers above.",
    text: "Today at @mtndao: Me making a bunch of explainer videos for ACCORD 🤯\n\nLink to explainers in the comments 👇",
    date: "Aug 20, 2026",
    meta: "215 views · 4 likes",
    media: "/blurb/explainer-making-of.jpg",
    mediaAlt: "Poster frame of the making-of explainer videos post",
    video: "/blurb/explainer-making-of.mp4",
    url: "https://x.com/xer0c/status/2090336880126726271",
  },
  {
    // x.com/xer0c/status/2110388109837779013 — Accord whitepaper
    // announcement; text verbatim (media t.co stripped), counts as of the
    // 2026-10-15 fetch
    kicker: "06 · the whitepaper",
    note: "The whitepaper thesis in one post: code handles execution, humans handle judgment — link to the paper in the thread.",
    text: "Smart contracts are deterministic.\nDisputes are not.\n\nThat’s why I brought native on-chain arbitration to @solana with Accord.\n\nRandom jurors. Transparent process. Binding on-chain verdicts.\n\nCode handles execution. Humans handle judgment.\n\nLink to whitepaper in the comments\n🧵👇",
    date: "Oct 14, 2026",
    meta: "567 views · 13 likes",
    media: "/blurb/accord-whitepaper.png",
    mediaAlt:
      "Cover of the Accord whitepaper: Schelling-Point Arbitration as a Composable Solana Primitive",
    url: "https://x.com/xer0c/status/2110388109837779013",
  },
  {
    // x.com/xer0c/status/2094103781646712882 — mtnDAO demo day pitch;
    // the full talk is linked in the thread's first comment:
    // youtube.com/watch?v=W816NeczDx8 (resolved 2026-09-28)
    kicker: "07 · the full pitch",
    note: "Accord and mutual risk pools in one demo-day pitch; the full talk is on YouTube.",
    text: "Solana @mtnDAO Demo Day with\n\n💡 Accord and Mutual Risk Pools\n\nDemo day pitch presenting Accord (), a Schelling point based adjudication system on Solana.\n\n✅select jurors from a pool,\n✅have them commit to & reveal a verdict\n✅majority rules\n\nIncentives do the hard work to keep keep jurors in line with the truth. \nThe only outcome of accord: A verdict, to be consumed by another Program.  \n\nA program on top has been built called Hanse: mutual risk pool - the oldest form of pooled protection on earth.\n\nLinks below 👇👇",
    date: "Aug 30, 2026",
    meta: "572 views · 15 likes",
    media: "/blurb/mtndao-demo-day.jpg",
    mediaAlt: "Photo from the mtnDAO demo day pitch in Salt Lake City",
    url: "https://x.com/xer0c/status/2094103781646712882",
    youtubeUrl: "https://www.youtube.com/watch?v=W816NeczDx8",
    youtubeEmbed: "https://www.youtube-nocookie.com/embed/W816NeczDx8",
  },
];

/** Explainer band intro — authored 2026-09-28 with the tweet embeds. */
export const EXPLAINERS_INTRO =
  "Short cuts and talks from the founder's build log, ordered by what they explain: the mutual, the verdict layer, the court — how the explainers got made — the whitepaper — and, last, the full mtnDAO demo-day pitch.";
