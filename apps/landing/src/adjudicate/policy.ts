// AdjudicationPolicy — the typed policy pack the session wizard's documents
// (step 1), policy (step 2), and verdict (step 3) screens consume
// (ADJUDICATION-DASHBOARD §7, bean riprap-gtni). Interface ONLY: the engine
// imports this module and never a concrete pack — the pack source is a
// provider behind the seam recorded in bean riprap-h6wp (swap to an anchored
// domain-CAS fetch when a second policy appears; an engine no-op).
//
// ZERO NUMBERS (spec §7, kit data law): no contributions, caps, windows, or
// treasury values ride the pack — every amount and clock is a chain read.
// The riprap-claim/v1 slot paths carry profile ordinals; those are file
// identities in the evidence manifest, not rendered numerals. Unit tests
// enforce the rule and cite the policy §s.
//
// Pure module: no React, no chain, no env.

/** One policy §7 proof slot, in policy order. */
export interface PolicyDocumentSlot {
  /** riprap-claim/v1 manifest path — the slot's identity in the delivered
   * evidence (the claim wizard's CLAIM_DOCUMENT_PATHS is the same list). */
  path: string;
  /** The document's plain name (policy §7). */
  label: string;
  /** What the juror verifies in this slot (copy doc § /app/adjudicate
   * step 1 renders path + this line). */
  whatToVerify: string;
}

/** The policy §7 same-person rule — one explicit cross-slot check after the
 * per-slot screens (ticket = ID = declaration = membership). */
export interface PolicySamePersonRule {
  /** The cross-check statement, shown once after the slots. */
  statement: string;
  /** The explicit tick that closes the check. */
  tickLabel: string;
}

/** The pack. Every string is quoted from the copy doc § /app/adjudicate and
 * the cover terms (policy §3/§4/§7) — never authored in code. */
export interface AdjudicationPolicy {
  /** Pack identity (audit/log only; never rendered as a numeral-bearing
   * value). */
  id: string;
  /** Policy §7 proof set, in policy order — five slots for the blade pool. */
  readonly documentSlots: readonly PolicyDocumentSlot[];
  /** Policy §7 cross-slot identity check. */
  samePersonRule: PolicySamePersonRule;
  /** Policy §7 evidence-use line, shown with the documents. */
  evidenceUseNote: string;
  /** Policy §3 covered-event criteria — yes/no/unsure questions; blank is
   * not an answer. */
  readonly coverageCriteria: readonly string[];
  /** Policy §4 exclusions — same yes/no/unsure questions. The tier-max
   * exclusion lands in verdictNote instead of this checklist (copy doc §
   * /app/adjudicate step 3). */
  readonly exclusions: readonly string[];
  /** Step 3 guidance: amount as filed; the tier cap is the chain's job;
   * an overpriced request can be denied outright (overpriced ⇒ Deny). */
  verdictNote: string;
}
