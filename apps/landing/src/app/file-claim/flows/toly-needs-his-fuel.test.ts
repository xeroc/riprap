// The Toly Needs His Fuel filing pack (bounty terms §3/§4/§7) — every
// string pinned verbatim with its terms citation, slots in §7 order, unique
// draft keys, and the pack-level laws: zero numerals, no emergency banner
// (a bounty has no urgent peril), no declaration slot (founder call,
// 2026-10-11 — the wallet signature is the statement of facts), and the
// confirmation as a URL slot (Toly's confirming post). Unlike the Blade
// Pool pack there is no CLAIM_DOCUMENT_PATHS parity (that list is the blade
// pool's canonical set; this pool's manifests carry their own five paths)
// and no adjudication policy parity yet (no Toly policy pack exists — the
// duty board is a separate workstream).
import { describe, expect, it } from "vitest";
import { TOLY_FUEL_FLOW } from "./toly-needs-his-fuel";

describe("TOLY_FUEL_FLOW document slots (terms §7, in order)", () => {
  it("five slots in terms §7 order: ticket, ID, request, handover, confirmation URL", () => {
    expect(TOLY_FUEL_FLOW.documentSlots).toHaveLength(5);
    expect(TOLY_FUEL_FLOW.documentSlots.map((s) => s.label)).toEqual([
      "your event ticket",
      "government photo ID",
      "the request — his post, message, or a witnessed statement",
      "the timestamped photo or video of the handover",
      "Toly's post confirming the request and the delivery",
    ]);
  });

  it("paths are unique, numbered, and never the blade set's — this pool's manifests carry their own canonical paths", () => {
    const paths = TOLY_FUEL_FLOW.documentSlots.map((s) => s.path);
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths).toEqual([
      "01-ticket.pdf",
      "02-id-document.jpg",
      "03-request-evidence.png",
      "04-delivery-evidence.jpg",
      "05-confirmation.url",
    ]);
  });

  it("the confirmation slot is the one URL slot (marker only) — every other slot is a file attach", () => {
    const urlSlots = TOLY_FUEL_FLOW.documentSlots.filter((s) => s.url !== undefined);
    expect(urlSlots).toEqual([
      {
        path: "05-confirmation.url",
        label: "Toly's post confirming the request and the delivery",
        url: "url",
      },
    ]);
  });

  it("no declaration slot — the wallet signature is the statement of facts (founder call)", () => {
    expect(TOLY_FUEL_FLOW.documentSlots.some((s) => s.path.includes("declaration"))).toBe(false);
  });
});

describe("TOLY_FUEL_FLOW step-1 screen (terms §3, in order)", () => {
  it("the four qualifying-delivery checks verbatim, §3 order, unique draft keys", () => {
    expect(TOLY_FUEL_FLOW.screenChecks).toEqual([
      {
        key: "request",
        label: "Toly asked for the hot drink — the request came from him, before the delivery",
      },
      {
        key: "procurement",
        label: "I obtained the drink myself, after the request, at my own expense",
      },
      {
        key: "handover",
        label:
          "I placed it, still hot, in Toly's hand — inside the event area, during the bounty period",
      },
      { key: "confirmation", label: "Toly confirmed the request and the delivery" },
    ]);
    expect(new Set(TOLY_FUEL_FLOW.screenChecks.map((c) => c.key)).size).toBe(
      TOLY_FUEL_FLOW.screenChecks.length,
    );
  });

  it("exclusions line + field placeholders quote the terms §4/§2/§7", () => {
    expect(TOLY_FUEL_FLOW.exclusionsLine).toBe(
      "Not paid: drinks he didn't ask for, drinks no longer hot at handover, iced drinks, handovers to an intermediary, drinks someone else paid for, deliveries outside the period or area, staged requests, more than one request per member.",
    );
    expect(TOLY_FUEL_FLOW.wherePlaceholder).toBe("inside the venue and the designated event area");
    expect(TOLY_FUEL_FLOW.narrativePlaceholder).toBe(
      "free text — your account of the request and the handover",
    );
  });
});

describe("TOLY_FUEL_FLOW step-3 evidence + manifest title (terms §7, §1/§5)", () => {
  it("evidence intro, attach note, and same-person statement verbatim", () => {
    expect(TOLY_FUEL_FLOW.evidenceIntro).toBe(
      "Five proofs, in this order. All five are required — an incomplete set is not adjudicated.",
    );
    expect(TOLY_FUEL_FLOW.attachAllNote).toBe(
      "Attach the four documents and paste the confirming post's URL to continue.",
    );
    expect(TOLY_FUEL_FLOW.samePersonStatement).toBe(
      "The ticket and the ID must both be yours — the person named on this membership.",
    );
  });

  it("manifest title names the act with the UTC delivery date", () => {
    expect(TOLY_FUEL_FLOW.manifestTitle("2026-11-16")).toBe(
      "Bounty request — hot drink delivered to Toly, 2026-11-16",
    );
  });

  it("carries no emergency banner — a bounty has no urgent peril (flow.ts)", () => {
    expect(TOLY_FUEL_FLOW.emergency).toBeUndefined();
  });

  it("zero numerals — money and clocks are chain reads (kit data law)", () => {
    const strings = [
      TOLY_FUEL_FLOW.evidenceIntro,
      TOLY_FUEL_FLOW.attachAllNote,
      TOLY_FUEL_FLOW.samePersonStatement,
      TOLY_FUEL_FLOW.exclusionsLine,
      TOLY_FUEL_FLOW.wherePlaceholder,
      TOLY_FUEL_FLOW.narrativePlaceholder,
      ...TOLY_FUEL_FLOW.screenChecks.map((c) => c.label),
      ...TOLY_FUEL_FLOW.documentSlots.map((s) => s.label),
    ];
    for (const s of strings) expect(s, s).not.toMatch(/\d/);
  });
});
