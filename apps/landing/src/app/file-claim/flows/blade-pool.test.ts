// The Blade Pool filing pack (copy doc § /app/file-claim, policy §3/§4/§7)
// — every string pinned verbatim, slots in policy order, and the path
// parity that keeps the claimant's manifest and the juror's evidence slots
// the same list (bean riprap-h6wp parity, adjudicate pack tests).
import { describe, expect, it } from "vitest";
import { BLADE_POOL_POLICY } from "../../../adjudicate/policies/blade-pool";
import { CLAIM_DOCUMENT_PATHS } from "../manifest";
import { BLADE_POOL_FLOW } from "./blade-pool";

describe("BLADE_POOL_FLOW document slots (policy §7, copy doc step 3)", () => {
  it("five slots in policy §7 order: ticket, ID, police, medical, declaration", () => {
    expect(BLADE_POOL_FLOW.documentSlots).toHaveLength(5);
    expect(BLADE_POOL_FLOW.documentSlots.map((s) => s.label)).toEqual([
      "your event ticket",
      "government photo ID",
      "the police report",
      "the treating practitioner's report",
      "your statutory declaration",
    ]);
  });

  it("paths are the manifest's canonical paths — the wizard's slots never drift from the riprap-claim/v1 set", () => {
    expect(BLADE_POOL_FLOW.documentSlots.map((s) => s.path)).toEqual([...CLAIM_DOCUMENT_PATHS]);
  });

  it("paths match the adjudication policy pack — claimant slots and juror slots are one list", () => {
    expect(BLADE_POOL_FLOW.documentSlots.map((s) => s.path)).toEqual(
      BLADE_POOL_POLICY.documentSlots.map((s) => s.path),
    );
  });
});

describe("BLADE_POOL_FLOW step-1 screen (policy §3, copy doc step 1)", () => {
  it("the four self-screen checks verbatim, §3 order, unique draft keys", () => {
    expect(BLADE_POOL_FLOW.screenChecks).toEqual([
      { key: "blade", label: "Another person used a knife or blade against me" },
      { key: "window", label: "It happened during the coverage window" },
      { key: "area", label: "It happened inside the covered area" },
      { key: "injury", label: "It caused bodily injury" },
    ]);
    expect(new Set(BLADE_POOL_FLOW.screenChecks.map((c) => c.key)).size).toBe(
      BLADE_POOL_FLOW.screenChecks.length,
    );
  });

  it("exclusions line + field placeholders quote the copy doc verbatim", () => {
    expect(BLADE_POOL_FLOW.exclusionsLine).toBe(
      "Not covered: injuries you caused yourself, accidents, ordinary knife handling, consensual activities, incidents outside the window or area, distress without qualifying injury.",
    );
    expect(BLADE_POOL_FLOW.wherePlaceholder).toBe(
      "in or around the venue and the designated event area",
    );
    expect(BLADE_POOL_FLOW.narrativePlaceholder).toBe(
      "free text — it feeds the statutory declaration",
    );
  });
});

describe("BLADE_POOL_FLOW step-3 evidence + manifest title (policy §7, §5)", () => {
  it("evidence intro, attach note, and same-person statement verbatim", () => {
    expect(BLADE_POOL_FLOW.evidenceIntro).toBe(
      "Five documents, in this order. All five are required — an incomplete set is not adjudicated.",
    );
    expect(BLADE_POOL_FLOW.attachAllNote).toBe("Attach all five to continue.");
    expect(BLADE_POOL_FLOW.samePersonStatement).toBe(
      "The ticket, the ID, and the declaration must all be yours — the person named on this membership.",
    );
  });

  it("manifest title names the peril with the UTC incident date", () => {
    expect(BLADE_POOL_FLOW.manifestTitle("2026-11-15")).toBe(
      "Payout request — knife assault, 2026-11-15",
    );
  });
});

describe("BLADE_POOL_FLOW emergency banner (copy doc § /app/file-claim)", () => {
  it("carries the banner body with the pool-page proof link", () => {
    expect(BLADE_POOL_FLOW.emergency?.lead).toBe(
      "Get care and police first. In an emergency call 999 (UK) or 112 (EU). Report the assault as soon as you safely can — the police report is one of ",
    );
    expect(BLADE_POOL_FLOW.emergency?.linkText).toBe("the five required proofs");
    expect(BLADE_POOL_FLOW.emergency?.linkHref).toBe("#/2026-breakpoint-blade-pool");
    expect(BLADE_POOL_FLOW.emergency?.tail).toBe(".");
  });
});
