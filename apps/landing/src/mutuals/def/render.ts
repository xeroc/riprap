// riprap-def/v1 — the canonical renderer: DefInput → the deterministic
// artifact bytes (milestone D1/D2). One markdown file: YAML frontmatter
// (fixed key order, stable whitespace, no timestamps — schema.ts's
// grammar is the inverse) + the 11-§ terms body with the two kind
// word-maps (sections.ts). Same DefInput, same bytes: `sha256(utf8(doc))`
// must reproduce months later, so nothing environment-derived ever
// enters the output.
//
// Doc bytes MAY carry numbers (dates, prices, fees) — they are terms, not
// UI; the zero-numbers law governs the packs built FROM the def, never
// the def itself. Deadpan register throughout (messaging-guide): the
// peril named plainly, never dramatized.
//
// Pure module: no UI, no chain, no daemon calls.

import type { PoolKind } from "../types";
import { DEF_SCHEMA, type DefFrontmatter, type DefTier, dq } from "./schema";
import { sectionTitles } from "./sections";

/** §7 filing economics — rendered once into §7 prose. Informational terms:
 * the on-chain initialize args stay authoritative. */
export interface DefEconomics {
  /** the pre-paid adjudication fee, whole USDC */
  filingFeeUsdc: number;
}

/** The wizard's authoring input: the machine block (frontmatter minus the
 * auto-stamped `schema`; `language` defaults to "en") plus the body prose
 * — the peril phrase (§1/§11), the §3 definition blocks, the §4 exclusion
 * lines, and optional §7 economics. */
export type DefInput = Omit<DefFrontmatter, "schema" | "language"> & {
  language?: string;
  /** §1/§11 — the peril (mutual) or the paid act (bounty), one phrase */
  peril: string;
  /** §3 — definition blocks, rendered verbatim in order */
  definition: string[];
  /** §4 — exclusion lines, rendered as bullets */
  exclusions: string[];
  economics?: DefEconomics;
};

/** `$1,000` — en-US grouped dollars (doc bytes; not a UI numeral). */
function usd(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}

/** Render the deterministic artifact. Throws on empty prose fields — a
 * def whose terms name nothing is not a def. */
export function renderDef(input: DefInput): string {
  if (input.peril.trim() === "") throw new Error("renderDef: peril must not be empty");
  if (input.tiers.length === 0) throw new Error("renderDef: at least one tier is required");
  for (const tier of input.tiers) {
    for (const [field, value] of [
      ["fee", tier.fee],
      ["cap", tier.cap],
    ] as const) {
      if (!Number.isSafeInteger(value)) {
        throw new Error(`renderDef: tier '${tier.name}' ${field} must be a safe integer`);
      }
    }
  }
  if (input.proof.length === 0) throw new Error("renderDef: at least one proof slot is required");
  if (input.definition.length === 0 || input.definition.some((b) => b.trim() === "")) {
    throw new Error("renderDef: definition must hold non-empty blocks");
  }
  if (input.exclusions.length === 0 || input.exclusions.some((l) => l.trim() === "")) {
    throw new Error("renderDef: exclusions must hold non-empty lines");
  }
  if (input.economics !== undefined) {
    const fee = input.economics.filingFeeUsdc;
    if (!Number.isSafeInteger(fee) || fee <= 0) {
      throw new Error("renderDef: economics.filingFeeUsdc must be a positive whole USDC amount");
    }
  }
  return `${renderFrontmatter(input)}${renderBody(input)}`;
}

// ---------------------------------------------------------------------------
// Frontmatter — fixed key order, strings always double-quoted, integers
// bare; exactly the grammar schema.ts parses.

function renderFrontmatter(input: DefInput): string {
  const lines: string[] = ["---"];
  lines.push(`schema: ${dq(DEF_SCHEMA)}`);
  lines.push(`kind: ${dq(input.kind)}`);
  lines.push(`slug: ${dq(input.slug)}`);
  lines.push(`name: ${dq(input.name)}`);
  lines.push("period:");
  lines.push(`  start: ${dq(input.period.start)}`);
  lines.push(`  end: ${dq(input.period.end)}`);
  lines.push(`  claims_close: ${dq(input.period.claims_close)}`);
  if (input.period.venue !== undefined) lines.push(`  venue: ${dq(input.period.venue)}`);
  lines.push("tiers:");
  for (const tier of input.tiers) {
    lines.push(`  - name: ${dq(tier.name)}`);
    lines.push(`    fee: ${tier.fee}`);
    lines.push(`    cap: ${tier.cap}`);
  }
  lines.push("proof:");
  for (const slot of input.proof) {
    lines.push(`  - slot: ${dq(slot.slot)}`);
    lines.push(`    kind: ${dq(slot.kind)}`);
    if (slot.label !== undefined) lines.push(`    label: ${dq(slot.label)}`);
    if (slot.verify !== undefined) lines.push(`    verify: ${dq(slot.verify)}`);
  }
  const marketing = renderMarketing(input.marketing);
  if (marketing.length > 0) {
    lines.push("marketing:");
    lines.push(...marketing);
  }
  lines.push(`language: ${dq(input.language ?? "en")}`);
  lines.push("---", "");
  return `${lines.join("\n")}\n`;
}

function renderMarketing(marketing: DefInput["marketing"]): string[] {
  if (marketing === undefined) return [];
  const lines: string[] = [];
  if (marketing.headline !== undefined) lines.push(`  headline: ${dq(marketing.headline)}`);
  if (marketing.blurb !== undefined) lines.push(`  blurb: ${dq(marketing.blurb)}`);
  if (marketing.logo !== undefined) lines.push(`  logo: ${dq(marketing.logo)}`);
  if (marketing.share !== undefined) lines.push(`  share: ${dq(marketing.share)}`);
  if (marketing.event !== undefined) lines.push(`  event: ${dq(marketing.event)}`);
  if (marketing.smallestPayout !== undefined) {
    lines.push(`  smallestPayout: ${marketing.smallestPayout}`);
  }
  return lines;
}

// ---------------------------------------------------------------------------
// Body — the 11 §s; fixed skeleton per kind, machine-block facts rendered
// in, author prose passed through verbatim.
// ---------------------------------------------------------------------------

function renderBody(input: DefInput): string {
  const titles = sectionTitles(input.kind);
  const contents = [
    section1(input),
    section2(input),
    section3(input),
    section4(input),
    section5(input),
    section6(input.kind),
    section7(input),
    section8(input.kind),
    section9(input.kind),
    section10(input),
    section11(input),
  ];
  const parts = contents.map((content, i) => `## ${i + 1}. ${titles[i]}\n\n${content.trim()}`);
  return `${parts.join("\n\n---\n\n")}\n`;
}

/** §1 Product. */
function section1(input: DefInput): string {
  if (input.kind === "mutual") {
    return [
      `**Micro Mutual** is a one-time mutual pool protecting members against **${input.peril}**.`,
      "",
      "Members contribute a fixed entry fee to a common pool. If a member experiences the covered event during the coverage period, they may request a **discretionary payment**, subject to adjudication, delivery of the required proof (§7), their coverage tier, and the remaining funds in the pool. No member has an enforceable right to a payment.",
      "",
      "After the payout request period closes, all remaining pool funds are distributed proportionally among members and the mutual is dissolved.",
    ].join("\n");
  }
  return [
    `**Micro Bounty** is a one-time bounty pool paying members for **${input.peril}**.`,
    "",
    "Members pay a fixed entry fee into a common pot. If a member completes the qualifying act during the bounty period, they may claim a **bounty**, subject to adjudication, delivery of the required proof (§7), the caps (§5), and the remaining funds in the pot. No member has an enforceable right to a payment.",
    "",
    "After the claim window closes, all remaining pot funds are distributed proportionally among members and the bounty pool is dissolved.",
  ].join("\n");
}

/** §2 Coverage Period / Bounty Period — from `period` (+ optional event frame). */
function section2(input: DefInput): string {
  const { period, marketing } = input;
  const lines: string[] = [];
  const event = marketing?.event;
  if (input.kind === "mutual") {
    lines.push(`Coverage begins ${period.start} and ends ${period.end}.`);
  } else {
    lines.push(`The bounty period begins ${period.start} and ends ${period.end}.`);
  }

  const frame = [event, period.venue].filter((part) => part !== undefined);
  if (frame.length > 0) {
    lines.push("", "Example:", "", `> **${frame.join(" — ")}**`);
    lines.push(
      input.kind === "mutual"
        ? `> Coverage: ${period.start} to ${period.end}`
        : `> Bounty period: ${period.start} to ${period.end}`,
    );
    lines.push(
      input.kind === "mutual"
        ? `> Payout requests close: ${period.claims_close}`
        : `> Claims close: ${period.claims_close}`,
    );
  }

  const areaClause = period.venue !== undefined ? " and within the covered area" : "";
  if (input.kind === "mutual") {
    lines.push(
      "",
      `Only incidents occurring during this period${areaClause} qualify. The payout request period closes ${period.claims_close}; requests submitted after it closes are not adjudicated.`,
    );
  } else {
    lines.push(
      "",
      `Only deliveries occurring during this period${areaClause} qualify. The claim window closes ${period.claims_close}; claims submitted after it closes are not adjudicated.`,
    );
  }
  return lines.join("\n");
}

/** §3 Covered Event / Qualifying Delivery — the author's definition. */
function section3(input: DefInput): string {
  const lead =
    input.kind === "mutual" ? `**${input.name}** means:` : "A **Qualifying Delivery** means:";
  return [lead, "", input.definition.join("\n\n")].join("\n");
}

/** §4 Exclusions — the author's lines as bullets. */
function section4(input: DefInput): string {
  const lead =
    input.kind === "mutual" ? "The following are not covered:" : "The following do not qualify:";
  return [lead, "", ...input.exclusions.map((line) => `- ${line}`)].join("\n");
}

/** §5 Coverage and Price / Bounty and Price — the tier table, verbatim
 * from the machine block's tiers. */
function section5(input: DefInput): string {
  const table = tierTable(input.kind, input.tiers);
  if (input.kind === "mutual") {
    return [
      table,
      "",
      "Every payment is **at most** the stated amount: if the total due — approved payments and returned adjudication fees — exceeds the funds in the pool, each payment is reduced proportionally (§7). The pool may be smaller than the payments it faces.",
      "",
      "Each person may hold one membership in the mutual. Joining closes when the coverage period begins, so a membership cannot be created after the covered event has occurred.",
    ].join("\n");
  }
  return [
    table,
    "",
    "Every payment is **at most** the stated amount: if the total due — approved payments and returned adjudication fees — exceeds the funds in the pot, each payment is reduced proportionally (§7). The pot may be smaller than the payments it faces.",
    "",
    "Each person may hold one membership in the bounty pool. Joining closes when the bounty period begins, so a membership cannot be created after a qualifying delivery has occurred.",
  ].join("\n");
}

function tierTable(kind: PoolKind, tiers: readonly DefTier[]): string {
  const payout = kind === "mutual" ? "Maximum Payout" : "Bounty";
  const header = ["Tier", "Entry Fee", payout];
  const rows = tiers.map((tier) => [tier.name, usd(tier.fee), `up to ${usd(tier.cap)}`]);
  const widths = header.map((h, c) => Math.max(h.length, ...rows.map((r) => r[c].length)));
  const row = (cells: string[]) =>
    `| ${cells.map((cell, c) => (c === 0 ? cell.padEnd(widths[c]) : cell.padStart(widths[c]))).join(" | ")} |`;
  const sep = `| ${widths
    .map((w, c) => (c === 0 ? "-".repeat(w) : `${"-".repeat(Math.max(w - 1, 1))}:`))
    .join(" | ")} |`;
  return [row(header), sep, ...rows.map(row)].join("\n");
}

/** §6 Pool / The Pot. */
function section6(kind: PoolKind): string {
  if (kind === "mutual") {
    return [
      "All member contributions enter a single mutual pool.",
      "",
      "The pool is used exclusively for:",
      "",
      "1. qualifying discretionary payments; and",
      "2. refunds to members after the payout request period.",
      "",
      "There is **no permanent reserve**.",
      "There is **no profit retained by the mutual**.",
    ].join("\n");
  }
  return [
    "All entry fees enter a single pot.",
    "",
    "The pot is used exclusively for:",
    "",
    "1. bounties for verified qualifying deliveries; and",
    "2. refunds to members after the claim window.",
    "",
    "There is **no permanent reserve**.",
    "There is **no profit retained by the bounty pool**.",
  ].join("\n");
}

/** §7 Payout Requests / Claims — proof from the machine block's slots,
 * economics rendered once into prose. */
function section7(input: DefInput): string {
  const mutual = input.kind === "mutual";
  const request = mutual ? "payout request" : "claim";
  const vessel = mutual ? "pool" : "pot";

  const proofLines = input.proof.map((slot, n) => {
    const label = slot.label ?? slot.slot;
    const verify = slot.verify !== undefined ? ` — ${slot.verify}` : "";
    return `${n + 1}. **${label}**${verify}`;
  });

  const lines: string[] = [];
  lines.push(
    mutual
      ? `A member may submit a payout request for a qualifying ${input.name} event occurring during the coverage period.`
      : "A member may submit a claim for a Qualifying Delivery occurring during the bounty period.",
  );
  lines.push("", "### Who may request", "");
  lines.push(
    mutual
      ? "A payout request is valid only if, at the time of the covered event, the requester:"
      : "A claim is valid only if, at the time of the delivery, the claimant:",
  );
  lines.push(
    "",
    `1. was the person in whose name a membership was registered, with its entry fee paid into the ${vessel} and confirmed on-chain beforehand; and`,
    "2. was an active member.",
    "",
    "Filing requires access to the member's own wallet: the request is submitted and the adjudication fee is paid from that wallet.",
    "",
    "### Required proof",
    "",
    `The ${vessel} only pays out when proof is delivered. A ${request} must include all of the following:`,
    "",
    ...proofLines,
    "",
    `The complete set of proof must belong to the same person, and that person must be the person in whose name the membership is registered. A ${request} that does not include the complete set of proof is not adjudicated, and no payment is made.`,
  );

  if (input.economics !== undefined) {
    lines.push(
      "",
      `Filing a ${request} requires pre-paying an adjudication fee of **${usd(input.economics.filingFeeUsdc)} USDC**. A denied or invalid ${request} forfeits the fee; a failed adjudication returns it to the requester.`,
    );
  }

  lines.push(
    "",
    `Evidence submitted with a ${request} is used solely to adjudicate that ${request}.`,
    "",
    "### Discretion",
    "",
    `All payments from the ${vessel} are **discretionary**:`,
    "",
    mutual
      ? "1. Payout requests are adjudicated by a randomly drawn jury of staked members (Accord, the sister arbitration protocol)."
      : "1. Claims are adjudicated by a randomly drawn jury of staked members (Accord, the sister arbitration protocol).",
    "2. No member has a contractual or enforceable right to any payment.",
    "3. The jury's determination is final once the appeal procedure of the adjudication protocol has been exhausted.",
    "",
    `If the total amount of approved ${mutual ? "requests" : "claims"} is less than the amount available in the ${vessel}, the remaining funds are returned to members.`,
    `If the total amount due — approved payments and returned adjudication fees — exceeds the funds available in the ${vessel}, payments and returns are reduced proportionally so that the ${vessel} never pays more than the amount it holds.`,
    "",
    "### Fraud",
    "",
    `A fraudulent ${request} is invalid, no payment is made, and the adjudication fee is forfeited.`,
  );
  return lines.join("\n");
}

/** §8 Pool Dissolution / Winding Up. */
function section8(kind: PoolKind): string {
  if (kind === "mutual") {
    return [
      "The mutual has a finite lifetime.",
      "",
      "After:",
      "",
      "1. the coverage period ends;",
      "2. the payout request period closes; and",
      "3. all approved payout requests have been settled,",
      "",
      "the remaining pool balance is distributed to eligible members. The mutual is then **dissolved permanently**. No funds remain in the mutual after dissolution.",
    ].join("\n");
  }
  return [
    "The bounty pool has a finite lifetime.",
    "",
    "After:",
    "",
    "1. the bounty period ends;",
    "2. the claim window closes; and",
    "3. all approved claims have been settled,",
    "",
    "the remaining pot balance is distributed to eligible members. The bounty pool is then **dissolved permanently**. No funds remain in the pot after dissolution.",
  ].join("\n");
}

/** §9 Economic Principle. */
function section9(kind: PoolKind): string {
  if (kind === "mutual") {
    return [
      "The mutual follows a simple principle:",
      "",
      "> **Members pool money to protect one another against a narrowly defined event. If the event costs less than expected, members recover the unused money.**",
      "",
      "The entry fee therefore represents the member's maximum contribution to the pool, while the coverage tier determines the member's maximum potential payout.",
    ].join("\n");
  }
  return [
    "The bounty pool follows a simple principle:",
    "",
    "> **Members fund bounties for verified acts. Work that is verified is paid. Money that is not earned comes back to the members.**",
    "",
    "The entry fee is the member's maximum contribution to the pot, and the bounty tier determines the member's maximum payout.",
  ].join("\n");
}

/** §10 Example — from doc facts only (fee, caps); pool sizes are unknowable
 * at authoring time, so none are invented. */
function section10(input: DefInput): string {
  const fees = input.tiers.map((t) => t.fee);
  const feeLine =
    fees.length > 1 && Math.min(...fees) !== Math.max(...fees)
      ? `${usd(Math.min(...fees))}–${usd(Math.max(...fees))}`
      : usd(fees[0]);
  const maxCap = Math.max(...input.tiers.map((t) => t.cap));
  return [
    `Each member contributes: **${feeLine}**`,
    input.kind === "mutual"
      ? `Maximum individual payout: **${usd(maxCap)}**`
      : `Maximum individual bounty: **${usd(maxCap)}**`,
    "",
    input.kind === "mutual"
      ? "If payments don't consume the pool, the remainder is returned to eligible members and the mutual is dissolved."
      : "If bounties don't consume the pot, the remainder is returned to eligible members and the bounty pool is dissolved.",
  ].join("\n");
}

/** §11 Product Promise. */
function section11(input: DefInput): string {
  if (input.kind === "mutual") {
    return [
      "**Join a temporary community mutual.**",
      "**Pay a fixed amount.**",
      `**Receive defined protection against ${input.peril}.**`,
      "**If payments don't consume the pool, the remaining money comes back to the members.**",
      "**When the event is over, the mutual ends.**",
    ].join("\n");
  }
  return [
    "**Join a temporary bounty pool.**",
    "**Pay a fixed amount.**",
    `**Get paid for proof of ${input.peril}.**`,
    "**If bounties don't consume the pot, the remaining money comes back to the members.**",
    "**When the event is over, the bounty ends.**",
  ].join("\n");
}
