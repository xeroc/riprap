// The Blade Pool policy pack (riprap-gtni). Law: ADJUDICATION-DASHBOARD §7 —
// five policy §7 slots in policy order + the same-person rule, policy §3
// coverage criteria, policy §4 exclusions (ten checklist items; the tier-max
// bullet lands in the verdict note per the copy doc step 3 decision), verdict
// guidance (overpriced ⇒ Deny; amount as filed). ZERO NUMBERS — spec §7 /
// kit data law: every amount and clock is a chain read. Every expected
// string quotes the copy doc § /app/adjudicate (steps 1–3) byte-exact.

import { describe, expect, it } from "vitest";
import { CLAIM_DOCUMENT_PATHS } from "../../app/file-claim/manifest";
import { BLADE_POOL_POLICY } from "./blade-pool";

/** Every pack string except `path` — the riprap-claim/v1 paths carry profile
 * ordinals (file identities in the evidence manifest, not rendered
 * numerals). */
function proseStrings(value: unknown, key = ""): string[] {
  if (typeof value === "string") return key === "path" ? [] : [value];
  if (Array.isArray(value)) return value.flatMap((v) => proseStrings(v));
  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => proseStrings(v, k));
  }
  return [];
}

describe("BLADE_POOL_POLICY document slots (policy §7, copy doc step 1)", () => {
  it("five slots in policy §7 order: ticket, ID, police, medical, declaration", () => {
    expect(BLADE_POOL_POLICY.documentSlots).toHaveLength(5);
    expect(BLADE_POOL_POLICY.documentSlots.map((s) => s.label)).toEqual([
      "Ticket",
      "Identity documentation",
      "Police report",
      "Medical report",
      "Statutory declaration",
    ]);
  });

  it("paths are the claim wizard's manifest paths — juror slots and claimant slots never drift (bean riprap-h6wp)", () => {
    expect(BLADE_POOL_POLICY.documentSlots.map((s) => s.path)).toEqual([...CLAIM_DOCUMENT_PATHS]);
  });

  it("whatToVerify quotes copy doc step 1 verbatim", () => {
    expect(BLADE_POOL_POLICY.documentSlots.map((s) => s.whatToVerify)).toEqual([
      "a valid ticket for the event, in the requester's own name",
      "government photo ID — passport, national identity card, or equivalent",
      "a police report of this incident",
      "the treating practitioner's report of the bodily injury",
      "the requester's sworn sequence of events",
    ]);
  });

  it("same-person rule quotes copy doc step 1 (policy §7: ticket = ID = declaration = member)", () => {
    expect(BLADE_POOL_POLICY.samePersonRule.statement).toBe(
      "The ticket, the ID, and the declaration name one person — the person on this membership.",
    );
    expect(BLADE_POOL_POLICY.samePersonRule.tickLabel).toBe("Same person throughout");
  });

  it("evidence-use note quotes policy §7 (copy doc step 1 privacy line)", () => {
    expect(BLADE_POOL_POLICY.evidenceUseNote).toBe(
      "Evidence is used solely to adjudicate this request.",
    );
  });
});

describe("BLADE_POOL_POLICY checklist (policy §3/§4, copy doc step 2)", () => {
  it("coverage criteria: the five policy §3 questions verbatim", () => {
    expect(BLADE_POOL_POLICY.coverageCriteria).toEqual([
      "Another person used a knife or blade against the requester",
      "It caused bodily injury — including while escaping or defending",
      "It happened during the coverage window",
      "It happened inside the covered area",
      "The requester was an active member at the time",
    ]);
  });

  it("exclusions: the ten policy §4 checklist items verbatim (tier-max rides the verdict note)", () => {
    expect(BLADE_POOL_POLICY.exclusions).toHaveLength(10);
    expect(BLADE_POOL_POLICY.exclusions).toEqual([
      "The injury was caused by the requester themselves",
      "The injury was accidental — involving a knife or blade",
      "The injury came from ordinary handling or use of a knife",
      "The injury resulted from consensual activities",
      "The assault was staged with the requester's cooperation or an accomplice's",
      "The requester was the initial aggressor, or a willing participant in a mutual fight",
      "The injury was sustained while the requester was committing a criminal offence",
      "It happened outside the coverage period",
      "It happened outside the covered area",
      "The request is based on emotional distress without qualifying bodily injury",
    ]);
  });
});

describe("BLADE_POOL_POLICY verdict guidance (spec §7, copy doc step 3)", () => {
  it("amount as filed; tier cap is the chain's job; overpriced can be denied outright", () => {
    expect(BLADE_POOL_POLICY.verdictNote).toBe(
      "The amount is as filed. The chain clamps it to the tier cap — the cap is the chain's job, not your question. An overpriced request can be denied outright.",
    );
  });
});

describe("zero numbers (spec §7 'NO numbers', kit data law)", () => {
  it("no pack string carries a numeral — contributions, caps, windows, treasury are chain reads", () => {
    const prose = proseStrings(BLADE_POOL_POLICY);
    expect(prose.length).toBeGreaterThan(0);
    for (const s of prose) {
      expect(s).not.toMatch(/\d/);
    }
  });

  it("no money symbol — amounts name their unit at render, never a sigil", () => {
    for (const s of proseStrings(BLADE_POOL_POLICY)) {
      expect(s).not.toContain("$");
    }
  });
});
