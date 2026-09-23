// The blurb page copy. Founder call (2026-09-23): copy lives inline here
// for now — the meta/marketing/03-website-copy doc lands in its own vault
// commit; until then every string's provenance rides in the comments.
// Register law: meta/marketing/07-brand-assets/messaging-guide.md — line
// set, banned words, numbers with sources. Pre-round law (2026-09-23
// founder call): no round numbers appear on this page or in the email —
// "terms and deck on request" only.

/** Page intro — what this page is and why it is unlisted. */
export const INTRO =
  "Everything on this page is meant to be copied: an explainer when you write about riprap, the logo files, and an email that introduces us to someone you know.";

/** Status line — the ask without numbers (pre-round law). */
export const STATUS = "raising a pre-seed now · terms and deck on request";

/** One-liner for chats — ecosystem line (messaging-guide line set,
 * 2026-09-15) + domain. */
export const ONE_LINE = "riprap — real-world risk protection on solana. riprap.xyz";

/** Short blurb, ~60 words — mechanism sentence (messaging-guide, verbatim)
 * + first pool (bound facts: Breakpoint, November, London) + founder. */
export const SHORT_BLURB = `Over 20% of every insurance dollar vanishes before a single claim is paid.

riprap to insurance is what DeFi is to finance.

Mutual risk pools are humanity's oldest protection — the original insurance. riprap puts them on-chain: peers chip in, peers settle claims. That changes what they can do.

Pilot: Blade Pool @ Breakpoint 2026, London, this November.

Built by Dr.-Ing. Fabian Schuh (full-time crypto since 2014) with Corinna, an AI agent on shift 24/7.

Insurance is next. riprap.xyz`;

/** Standard blurb, ~150 words — llms.txt platform paragraph (approved
 * copy) + two-exit-doors law (PROJECT.md) + team + first pool. */
export const STANDARD_BLURB = `Over 20% of every insurance dollar vanishes before a single claim is paid.

On-chain, they become composable, permissionless, and globally accessible 24/7. They plug into other protocols, open to anyone, and run without borders or gatekeepers. Faster, Cheaper and more transparent.

Mutual risk pools are humanity's oldest protection — the original insurance. riprap puts them on-chain: peers chip in, peers settle claims. That changes what they can do.

How it works:

 - Members pay a fixed fee into a pool.
 - Incidents are judged by jurors staked from the pool itself.
 - Verdicts run on Accord, a Schelling-point arbitration protocol.
 - Approved claims pay out of the pool.

At scale, this produces what traditional insurers structurally can't — the same way DeFi outran TradFi. This is how we rebuild insurance: layer by layer, starting here.

Built by Dr.-Ing. Fabian Schuh — full-time crypto since 2014 — with Corinna, an AI agent on shift 24/7.

Pilot: Blade Pool @ Breakpoint 2026, Olympia, London, 15–17 Nov. riprap.xyz`;

/** Forwardable email — written in the introducer's voice ("I want to
 * introduce you to Fabian…"), plain text, no links except the blurb page.
 * Founder rows and rails verbatim from the deck team/now slides; round
 * terms deliberately absent (pre-round law). */
export const EMAIL_TO = "[investor name]";

export const EMAIL_SUBJECT = "Intro: riprap is to insurance what DeFi is to finance.";

export const EMAIL_BODY = `Hi [name],

Meet Fabian. He's building riprap.

Mutual risk pools are humanity's oldest protection — the original insurance. riprap puts them on-chain: peers chip in, peers settle claims.

On-chain, they become composable, permissionless, and globally accessible 24/7. They plug into other protocols, open to anyone, and run without borders or gatekeepers. Faster, Cheaper and more transparent.

They already built the rails this runs on:

 - Pull payments for recurring premiums — tributary.so
 - On-chain claims adjudication — useaccord.xyz

First pool goes live at Breakpoint, Solana's flagship conference — 15–17 Nov 2026, London.

Why Fabian: full-time in crypto since 2014. He was the first hire ever paid directly by a blockchain, and he built BitShares' escrow and worker-proposal treasury. He ships with Corinna, an AI agent on shift 24/7.

He's raising a pre-seed now — deck and terms on request.

Worth 20 minutes? → https://riprap.xyz/#/blurb`;

/** The full email as one clipboard string — subject rides along so the
 * introducer can paste it into the compose window's subject field. */
export const EMAIL_FULL = `Subject: ${EMAIL_SUBJECT}\n\n${EMAIL_BODY}`;

/** Team — from the seed deck team slide
 * (apps/pitch-seed-raise/src/deck/slides.tsx); founder rows edited by
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
 * (apps/pitch-seed-raise/src/deck/slides.tsx, 2026-09-23). */
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
