import { TIERS, usd } from "@riprap/ui";

/**
 * Blade Pool intro — every string and number on screen, one file.
 *
 * Provenance law (AGENTS.md): instance numbers come only from
 * meta/Breakpoint/Micro Mutual — Knife Assault - Policy.md (§2 dates,
 * §5 tiers, §10 worked example) and meta/PROJECT.md (Mara frame, worked
 * example, fail-closed economics). Taglines from
 * meta/marketing/07-brand-assets/messaging-guide.md. Nothing invented.
 */

/** instance ad, not a headline — the peril word stays in body prose (naming lock) */
export const HOOK_KICKER = "PILOT — THE FIRST POOL ON RIPRAP";
export const HOOK_HEADLINE_PRE = "What if";
export const HOOK_HEADLINE_NUM = "$20"; // policy §5 Standard entry fee
export const HOOK_HEADLINE_POST = "on-chain";
export const HOOK_HEADLINE_LINE2 = "could cover you";
export const HOOK_HEADLINE_LINE3 = "at Breakpoint?";
/** plain-word peril in body prose, deadpan (messaging-guide § Voice) */
export const HOOK_SUB = "a pilot: cover for knife assault"; // policy §2

// ── S2 · chip in ─────────────────────────────────────────────────────────────

export const JOIN_HEADLINE = "Chip in. One time.";
export const JOIN_SUB = "the entry fee is the most you can lose. the cap is the most you can get."; // policy §9
/** policy §10 worked example, opening line */
export const JOIN_FIGURES = {
  members: "1,000",
  fee: usd(TIERS[1].fee), // $20 — Standard
  pool: usd(20000),
};
export const JOIN_FIGURE_CAPTION = "1,000 members × $20 (Standard) → $20,000 pool";

// ── S3 · the claim ───────────────────────────────────────────────────────────

export const CLAIM_HEADLINE = "If the worst happens.";
export const CLAIM_STEPS = ["file a claim", "members drawn", "ruling"];
/** composition.md finish checklist #5: the rejected branch is always drawn */
export const CLAIM_REJECTED = "rejected — the claim closes, nothing moves";
export const CLAIM_PERIL = "covered: knife assault during the conference, inside the venue."; // policy §2–3

// ── S4 · settlement ──────────────────────────────────────────────────────────

export const SETTLE_HEADLINE_PRE = "$12,000";
export const SETTLE_HEADLINE_POST = "remains.";
/** the claim count, stated plainly — the ledger's key row (policy §10) */
export const SETTLE_SUB = "after 4 approved claims";
/** policy §10, in reading order — the receipt's line items */
export const WORKED_LINES = [
  { value: "1,000", caption: "members" },
  { value: "× $20", caption: "entry (Standard)" },
  { value: "$20,000", caption: "pool" },
  { value: "4 × $2,000", caption: "approved claims" },
  { value: "− $8,000", caption: "paid out" },
];
/** policy §10 — the closing figure, set off like a bill total */
export const WORKED_TOTAL = { value: "$12,000", caption: "remains" };
export const WORKED_LABEL = "worked example · blade pool";

// ── S5 · refund ──────────────────────────────────────────────────────────────

/** the payoff hook (approved line, 2026-09-17); "refunded" carries
 * funds-ink in the scene — money returning is funds semantics */
export const REFUND_HOOK_PRE = "and the best: what's left is";
export const REFUND_HOOK_POST = "refunded!";
/** policy §10: $12,000 remains ÷ 1,000 members = $12 each */
export const REFUND_SUB_PRE = "$12";
export const REFUND_SUB_POST = "to every member.";

// ── S6 · endcard ─────────────────────────────────────────────────────────────

export const END_DATES = "15–17 November 2026 · Olympia, London"; // policy §2
export const END_TAGLINE = "peer-to-peer cover on Solana"; // messaging-guide taglines
export const END_ECOSYSTEM = ""; // messaging-guide ecosystem line
export const END_LINK = "riprap.xyz"; // naming.md: registered domain

// ── tier cards (S2) come straight from the kit's TIERS — never re-typed ──────
export const TIERS_FOR_CARDS = TIERS;
