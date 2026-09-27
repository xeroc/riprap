// The Blade Pool policy pack (Riprap: Blade Pool @ Breakpoint 2026). Every
// string quotes the copy doc § /app/adjudicate (source of record for
// user-visible strings, authored 2026-09-25) and the cover terms
// (meta/Breakpoint/Micro Mutual — Knife Assault - Policy.md §3/§4/§7).
// Zero numerals: money and clocks are chain reads (kit data law; the pack
// tests enforce and cite the §s).

import type { AdjudicationPolicy } from "../policy";

export const BLADE_POOL_POLICY: AdjudicationPolicy = {
  id: "blade-pool",

  // Policy §7 required proof, in policy order — the same five paths the
  // claim wizard files (riprap-claim/v1, CLAIM_DOCUMENT_PATHS).
  documentSlots: [
    {
      path: "01-ticket.pdf",
      label: "Ticket",
      whatToVerify: "a valid ticket for the event, in the requester's own name",
    },
    {
      path: "02-id-document.jpg",
      label: "Identity documentation",
      whatToVerify: "government photo ID — passport, national identity card, or equivalent",
    },
    {
      path: "03-police-report.pdf",
      label: "Police report",
      whatToVerify: "a police report of this incident",
    },
    {
      path: "04-medical-report.pdf",
      label: "Medical report",
      whatToVerify: "the treating practitioner's report of the bodily injury",
    },
    {
      path: "05-statutory-declaration.pdf",
      label: "Statutory declaration",
      whatToVerify: "the requester's sworn sequence of events",
    },
  ],

  // Policy §7: the ticket, the identity documentation, and the statutory
  // declaration must belong to the same person — the named member.
  samePersonRule: {
    statement:
      "The ticket, the ID, and the declaration name one person — the person on this membership.",
    tickLabel: "Same person throughout",
  },

  // Policy §7: evidence is used solely to adjudicate the request.
  evidenceUseNote: "Evidence is used solely to adjudicate this request.",

  // Policy §3 covered event — the incident conditions.
  coverageCriteria: [
    "Another person used a knife or blade against the requester",
    "It caused bodily injury — including while escaping or defending",
    "It happened during the coverage window",
    "It happened inside the covered area",
    "The requester was an active member at the time",
  ],

  // Policy §4 exclusions — the ten checklist items. The eleventh §4 bullet
  // (requests exceeding the coverage-tier maximum) lands in verdictNote per
  // the copy doc § /app/adjudicate step 3 decision, not in this checklist.
  exclusions: [
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
  ],

  // Overpriced ⇒ Deny; amount as filed; the tier cap is the chain's job,
  // reasonableness is the juror's (spec §7 verdict guidance).
  verdictNote:
    "The amount is as filed. The chain clamps it to the tier cap — the cap is the chain's job, not your question. An overpriced request can be denied outright.",
};
