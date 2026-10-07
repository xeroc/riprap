// The Blade Pool filing pack (Riprap: Blade Pool @ Breakpoint 2026). Every
// string quotes the copy doc § /app/file-claim (source of record for
// user-visible strings) and the cover terms
// (meta/Breakpoint/Micro Mutual — Knife Assault - Policy.md §3/§4/§7).
// Zero numerals beyond emergency phone numbers: money and clocks are chain
// reads (kit data law; the pack tests enforce and cite the §s).

import type { ClaimFlow } from "../flow";

export const BLADE_POOL_FLOW: ClaimFlow = {
  id: "blade-pool",

  // Policy §7 required proof, in policy order — the same five paths the
  // adjudication policy pack verifies (BLADE_POOL_POLICY.documentSlots) and
  // the riprap-claim/v1 manifest's default canonical set
  // (manifest.ts CLAIM_DOCUMENT_PATHS). The pack tests pin the parity.
  documentSlots: [
    { path: "01-ticket.pdf", label: "your event ticket" },
    { path: "02-id-document.jpg", label: "government photo ID" },
    { path: "03-police-report.pdf", label: "the police report" },
    { path: "04-medical-report.pdf", label: "the treating practitioner's report" },
    { path: "05-statutory-declaration.pdf", label: "your statutory declaration" },
  ],

  // Copy doc § step 3 intro (policy §7: all five required, in order).
  evidenceIntro:
    "Five documents, in this order. All five are required — an incomplete set is not adjudicated.",
  attachAllNote: "Attach all five to continue.",
  samePersonStatement:
    "The ticket, the ID, and the declaration must all be yours — the person named on this membership.",

  // Policy §3 covered event — the step-1 self-screen, §3 order.
  screenChecks: [
    { key: "blade", label: "Another person used a knife or blade against me" },
    { key: "window", label: "It happened during the coverage window" },
    { key: "area", label: "It happened inside the covered area" },
    { key: "injury", label: "It caused bodily injury" },
  ],

  // Step-1 exclusions line — the copy doc's §4 summary sentence.
  exclusionsLine:
    "Not covered: injuries you caused yourself, accidents, ordinary knife handling, consensual activities, incidents outside the window or area, distress without qualifying injury.",
  wherePlaceholder: "in or around the venue and the designated event area",
  narrativePlaceholder: "free text — it feeds the statutory declaration",

  // §5 manifest title: the peril named plainly, the incident date appended.
  manifestTitle: (incidentIsoDate) => `Payout request — knife assault, ${incidentIsoDate}`,

  // Copy doc § /app/file-claim emergency banner — leads every step.
  emergency: {
    lead: "Get care and police first. In an emergency call 999 (UK) or 112 (EU). Report the assault as soon as you safely can — the police report is one of ",
    linkText: "the five required proofs",
    linkHref: "#/2026-breakpoint-blade-pool",
    tail: ".",
  },
};
