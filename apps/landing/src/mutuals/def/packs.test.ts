// The def → pack builders (epic riprap-hs4r): kind-templated screens and
// criteria, doc-derived exclusions and verify lines, slot parity between the
// claimant and juror packs, and the zero-numbers law — no template string
// carries a numeral; amounts and clocks are chain reads (kit data law; the
// static pack tests' rule, applied to the built packs).
import { describe, expect, it } from "vitest";
import { adjudicationPolicyFor } from "../../adjudicate/policies/index";
import type { AdjudicationPolicy } from "../../adjudicate/policy";
import type { ClaimFlow } from "../../app/file-claim/flow";
import { claimFlowFor } from "../../app/file-claim/flows/index";
import { buildAdjudicationPolicy, buildClaimFlow } from "./packs";
import type { RiprapDef } from "./schema";

/** A mutual def with §4 exclusions and per-slot verify lines in the body. */
const MUTUAL_DEF: RiprapDef = {
  schema: "riprap-def/v1",
  kind: "mutual",
  slug: "chairmageddon",
  name: "Chairmageddon",
  period: { start: "2026-11-15", end: "2026-11-17", claims_close: "2026-11-24", venue: "Olympia" },
  tiers: [{ name: "Flat", fee: 10, cap: 40 }],
  proof: [
    {
      slot: "01-ticket.pdf",
      kind: "file",
      label: "your event ticket",
      verify: "a ticket in your own name",
    },
    { slot: "02-id.jpg", kind: "file", label: "government photo ID" },
    { slot: "03-post.url", kind: "url", label: "the public post about it" },
  ],
  language: "en",
  body: [
    "## 4. Exclusions",
    "",
    "The following are not covered:",
    "",
    "- Seats available when the member arrived.",
    "- Members who sat at any point during the ceremony.",
    "",
  ].join("\n"),
};

/** The bounty word-map: kind is a copy selector only (D8). */
const BOUNTY_DEF: RiprapDef = {
  ...MUTUAL_DEF,
  kind: "bounty",
  slug: "hot-drink",
  name: "Hot Drink",
};

describe("buildClaimFlow", () => {
  const flow = buildClaimFlow(MUTUAL_DEF);

  it("derives the document slots from the def's proof list — url kind marks the url slot", () => {
    expect(flow.documentSlots).toEqual([
      { path: "01-ticket.pdf", label: "your event ticket", url: undefined },
      { path: "02-id.jpg", label: "government photo ID", url: undefined },
      { path: "03-post.url", label: "the public post about it", url: "url" },
    ]);
  });

  it("carries no emergency — community defs name no urgent peril", () => {
    expect(flow.emergency).toBeUndefined();
  });

  it("kind-templates the screens and the manifest title", () => {
    expect(flow.screenChecks.map((c) => c.key)).toEqual(["event", "window", "area", "member"]);
    expect(flow.manifestTitle("2026-11-15")).toBe("Payout request — Chairmageddon, 2026-11-15");
    const bounty = buildClaimFlow(BOUNTY_DEF);
    expect(bounty.screenChecks[0]?.label).toContain("qualifying act");
    expect(bounty.manifestTitle("2026-11-15")).toBe("Bounty claim — Hot Drink, 2026-11-15");
  });

  it("reads the exclusions line off the doc's §4", () => {
    expect(flow.exclusionsLine).toBe(
      "Not covered: Seats available when the member arrived., Members who sat at any point during the ceremony..",
    );
    expect(buildClaimFlow(BOUNTY_DEF).exclusionsLine).toContain("Not paid:");
  });

  it("holds the zero-numbers law on every template string (kit data law)", () => {
    const templateStrings: string[] = [
      flow.evidenceIntro,
      flow.attachAllNote,
      flow.samePersonStatement,
      ...flow.screenChecks.map((c) => c.label),
      flow.wherePlaceholder,
      flow.narrativePlaceholder,
    ];
    for (const s of templateStrings) expect(s, s).not.toMatch(/\d/);
  });
});

describe("buildAdjudicationPolicy", () => {
  const policy = buildAdjudicationPolicy(MUTUAL_DEF);

  it("derives juror slots with the def's verify lines, defaulting the generic screen", () => {
    expect(policy.documentSlots.map((s) => s.whatToVerify)).toEqual([
      "a ticket in your own name",
      "the proof the terms ask for, in the requester's own name",
      "the proof the terms ask for, in the requester's own name",
    ]);
  });

  it("kind-templates the coverage criteria and carries the tier-max verdict note", () => {
    expect(policy.coverageCriteria[0]).toContain("covered event");
    expect(buildAdjudicationPolicy(BOUNTY_DEF).coverageCriteria[0]).toContain("qualifying act");
    expect(policy.verdictNote).toContain("clamps it to the tier's maximum");
    expect(policy.verdictNote).toContain("denied outright");
  });

  it("reads the exclusions checklist off the doc's §4", () => {
    expect(policy.exclusions).toEqual([
      "Seats available when the member arrived.",
      "Members who sat at any point during the ceremony.",
    ]);
  });

  it("holds the zero-numbers law on every template string", () => {
    const templateStrings: string[] = [
      policy.samePersonRule.statement,
      policy.samePersonRule.tickLabel,
      policy.evidenceUseNote,
      ...policy.coverageCriteria,
      policy.verdictNote,
    ];
    for (const s of templateStrings) expect(s, s).not.toMatch(/\d/);
    // the generic verify default too
    expect(policy.documentSlots[1]?.whatToVerify).not.toMatch(/\d/);
  });
});

describe("slot parity — claimant and juror packs are one list", () => {
  it("the built flow and policy carry identical slot paths in identical order", () => {
    const flow: ClaimFlow = buildClaimFlow(MUTUAL_DEF);
    const policy: AdjudicationPolicy = buildAdjudicationPolicy(MUTUAL_DEF);
    expect(flow.documentSlots.map((s) => s.path)).toEqual(policy.documentSlots.map((s) => s.path));
    expect(flow.documentSlots.map((s) => s.label)).toEqual(
      policy.documentSlots.map((s) => s.label),
    );
  });
});

describe("the registries' def path", () => {
  it("def-driven pools build their packs from the doc, never the static tables", () => {
    const flow = claimFlowFor(undefined, MUTUAL_DEF);
    const policy = adjudicationPolicyFor(undefined, MUTUAL_DEF);
    expect(flow?.id).toBe("chairmageddon");
    expect(policy?.id).toBe("chairmageddon");
    // without a def, an unknown listing still resolves to nothing
    expect(claimFlowFor(undefined)).toBeNull();
    expect(adjudicationPolicyFor(undefined)).toBeNull();
  });
});
