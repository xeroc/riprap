// ClaimFlow — the typed filing pack the payout-request wizard consumes
// (CLAIM-WIZARD §4, mirrored on adjudicate/policy.ts). One pack per pool:
// every pool-specific string and slot the wizard renders lives here, keyed
// by the pool's `claimFlow` field in mutuals/data.ts — the wizard engine
// imports this module and never a concrete pack. The pack source is always
// the pool's policy doc (§3 checks, §4 exclusions line, §7 proof set) and
// the copy doc § /app/file-claim — never authored in code.
//
// ZERO NUMBERS (kit data law): no contributions, caps, windows, or fees ride
// the pack — every amount and clock is a chain read. The riprap-claim/v1
// slot paths carry document ordinals; those are file identities in the
// evidence manifest, not rendered numerals.
//
// Pure module: no React, no chain, no env.

/** One policy §7 proof slot, in policy order — `path` is the slot's identity
 *  in the riprap-claim/v1 manifest and at the evidence operator. */
export interface DocSlot {
  /** riprap-claim/v1 manifest path — the wizard, the manifest hash, the
   *  operator, and the adjudication policy pack all key on this string. */
  path: string;
  /** The member-facing plain name (wizard step 3 row label). */
  label: string;
}

/** One step-1 self-screen checkbox (policy §3 / §4): `key` is the draft's
 *  screen-record key — stable per pool, part of the persisted draft shape. */
export interface ScreenCheck {
  key: string;
  label: string;
}

/** The emergency banner (copy doc § /app/file-claim) — optional: pools with
 *  no urgent peril omit it. The body renders with the link inline; numerals
 *  (999/112) render mono via the kit's numeral segments. */
export interface EmergencySpec {
  lead: string;
  linkText: string;
  linkHref: string;
  tail: string;
}

/** The pack. Every string quotes the copy doc § /app/file-claim and the
 *  pool's policy doc — never authored in code. */
export interface ClaimFlow {
  /** Pack identity — matches the listing's `claimFlow` field (data.ts). */
  id: string;
  /** Policy §7 proof set, in policy order — the manifest's canonical paths. */
  readonly documentSlots: readonly DocSlot[];
  /** Step-3 intro: the count and the all-required rule (policy §7). */
  evidenceIntro: string;
  /** Step-3 incomplete-set note — shown until every slot is attached. */
  attachAllNote: string;
  /** Policy §7 same-person attestation — the step-3 tick statement. */
  samePersonStatement: string;
  /** Step-1 self-screen, policy §3 order — a screen, not a verdict. */
  readonly screenChecks: readonly ScreenCheck[];
  /** Step-1 exclusions line — the policy §4 summary, one sentence. */
  exclusionsLine: string;
  /** Step-1 `Where` placeholder — the policy's covered-area phrasing. */
  wherePlaceholder: string;
  /** Step-1 `What happened` placeholder — names the §7 doc it feeds. */
  narrativePlaceholder: string;
  /** The manifest title — the peril named plainly, with the incident date. */
  manifestTitle: (incidentIsoDate: string) => string;
  /** The emergency banner; omit for pools with no urgent peril. */
  emergency?: EmergencySpec;
}
