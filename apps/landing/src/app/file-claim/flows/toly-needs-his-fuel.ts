// The Toly Needs His Fuel filing pack (Micro Bounty @ Breakpoint 2026).
// Every string quotes the bounty terms
// (meta/Breakpoint/Micro Bounty — Toly Needs His Fuel - Terms.md §3/§4/§7);
// the frame copy (step labels, buttons, notes) is the copy doc §
// /app/file-claim's, shared with the Blade Pool pack. Zero numerals: money
// and clocks are chain reads (kit data law). No emergency banner — a bounty
// has no urgent peril (flow.ts: pools without one omit it). No declaration
// slot (founder call, 2026-10-11) — the wallet signature on the claim is
// the member's statement of facts; the confirmation proof is Toly's post
// itself, delivered as its URL.

import type { ClaimFlow } from "../flow";

export const TOLY_FUEL_FLOW: ClaimFlow = {
  id: "toly-needs-his-fuel",

  // Terms §7 required proof, in terms order — the five-slot canonical set
  // this pool's manifests carry (the wizard passes these paths to
  // buildClaimManifest; the blade default set does not apply here). The
  // confirmation is a URL slot: the member pastes Toly's confirming post
  // and the URL's UTF-8 bytes are that slot's document (flow.ts DocSlot).
  documentSlots: [
    { path: "01-ticket.pdf", label: "your event ticket" },
    { path: "02-id-document.jpg", label: "government photo ID" },
    {
      path: "03-request-evidence.png",
      label: "the request — his post, message, or a witnessed statement",
    },
    { path: "04-delivery-evidence.jpg", label: "the timestamped photo or video of the handover" },
    {
      path: "05-confirmation.url",
      label: "Toly's post confirming the request and the delivery",
      // the manifest carries the RAW link under this key — no file, no PUT
      url: "confirmation-url",
    },
  ],

  // Terms §7: all five required, in order — "a claim that does not include
  // the complete set of proof is not adjudicated".
  evidenceIntro:
    "Five proofs, in this order. All five are required — an incomplete set is not adjudicated.",
  attachAllNote: "Attach the four documents and paste the confirming post's URL to continue.",
  // Terms §7 closing rule: the ticket and the ID belong to one person — the
  // named member.
  samePersonStatement:
    "The ticket and the ID must both be yours — the person named on this membership.",

  // Terms §3 Qualifying Delivery — the step-1 self-screen, §3 order (the
  // request, the procurement, the handover, the confirmation).
  screenChecks: [
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
        "I placed it, still hot, in Toly's hand — inside the covered area, during the bounty period",
    },
    { key: "confirmation", label: "Toly confirmed the request and the delivery" },
  ],

  // Step-1 exclusions line — the terms §4 summary, one sentence.
  exclusionsLine:
    "Not paid: drinks he didn't ask for, drinks no longer hot at handover, iced drinks, handovers to an intermediary, drinks someone else paid for, deliveries outside the period or area, staged requests, more than one claim per member.",
  wherePlaceholder: "inside the venue and the designated event area",
  narrativePlaceholder: "free text — your account of the request and the handover",

  // Terms §1/§5: the manifest title names the act plainly, the delivery
  // date appended.
  manifestTitle: (incidentIsoDate) =>
    `Bounty claim — hot drink delivered to Toly, ${incidentIsoDate}`,
};
