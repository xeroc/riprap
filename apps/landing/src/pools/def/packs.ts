// def → pack builders (epic riprap-hs4r, HANDOFF §4): a community pool's
// anchored riprap-def/v1 doc projected onto the ClaimFlow and
// AdjudicationPolicy interfaces the claim wizard and juror session already
// consume — interfaces unchanged, registries gain the def path. Pure: no
// React, no chain, no daemon.
//
// ZERO NUMBERS (kit data law): every kind-templated string below carries no
// numerals — amounts and clocks are chain reads. Doc-derived strings
// (exclusions, verify notes, the name) are the doc's own bytes, terms not
// UI. The slot paths carry the doc's ordinals; those are file identities in
// the evidence manifest, not rendered numerals.

import type { AdjudicationPolicy, PolicyDocumentSlot } from "../../adjudicate/policy";
import type { ClaimFlow, DocSlot } from "../../app/file-claim/flow";
import type { RiprapDef } from "./schema";
import { listItems, paragraphs, sectionByHeading } from "./sections";

/** Def proof slots, doc order — the one list both packs derive from: the
 *  claimant's wizard files it, the juror's session verifies it, and the
 *  manifest's canonical paths are its paths (slot parity by construction). */
function docSlots(def: RiprapDef): DocSlot[] {
  return def.proof.map((p) => ({
    path: p.slot,
    label: p.label ?? p.slot,
    ...(p.verify !== undefined && p.verify.trim() !== "" ? { verify: p.verify } : {}),
    // url slots mark presence — the raw value is unused (flow.ts DocSlot)
    url: p.kind === "url" ? "url" : undefined,
  }));
}

function jurorSlots(def: RiprapDef): PolicyDocumentSlot[] {
  return def.proof.map((p) => ({
    path: p.slot,
    label: p.label ?? p.slot,
    // the def's per-slot verify line when it carries one, else the generic
    // screen (D3: kind-templated generic questions + the raw terms)
    whatToVerify: p.verify ?? "the proof the terms ask for, in the requester's own name",
  }));
}

/** The doc's `## Exclusions` block (numbered or not), list order unless
 *  the author wrote prose — the step-1 summary and the juror checklist
 *  read the same lines. */
function exclusionLines(def: RiprapDef): string[] {
  const section = sectionByHeading(def.body, /exclusions?/i);
  if (section === null) return [];
  const items = listItems(section.body);
  return items.length > 0 ? items : paragraphs(section.body);
}

/** Spelled counts keep the packs' voice; anything past nine reads "All". */
const COUNT_WORDS = ["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];

/** The def-driven filing pack — kind-templated screens, doc-derived
 *  exclusions, no emergency (community defs name no urgent peril). */
export function buildClaimFlow(def: RiprapDef): ClaimFlow {
  const exclusions = exclusionLines(def);
  const bounty = def.kind === "bounty";
  const count = COUNT_WORDS[def.proof.length - 1] ?? "All";
  return {
    id: def.slug,
    documentSlots: docSlots(def),
    evidenceIntro: `${count} proof${def.proof.length === 1 ? "" : "s"}, in the doc's order. All of them are required — an incomplete set is not adjudicated.`,
    attachAllNote: "Attach every required proof to continue.",
    samePersonStatement:
      "The proofs that name a person must all name you — the person on this membership.",
    screenChecks: bounty
      ? [
          {
            key: "act",
            label: "I performed the qualifying act, as the terms define it",
          },
          { key: "window", label: "It happened inside the pool's window" },
          { key: "area", label: "It happened inside the pool's area" },
          { key: "member", label: "I was an active member when it happened" },
        ]
      : [
          {
            key: "event",
            label: "The qualifying event happened to me, as the terms define it",
          },
          { key: "window", label: "It happened inside the pool's window" },
          { key: "area", label: "It happened inside the pool's area" },
          { key: "member", label: "I was an active member when it happened" },
        ],
    exclusionsLine:
      exclusions.length > 0
        ? `${bounty ? "Not paid" : "Excluded"}: ${exclusions.join(", ")}.`
        : bounty
          ? "Not paid: anything the terms exclude."
          : "Excluded: anything the terms exclude.",
    wherePlaceholder:
      def.period.venue !== undefined
        ? `in and around ${def.period.venue}`
        : "inside the pool's area",
    narrativePlaceholder: "free text — your account of what happened",
    manifestTitle: (incidentIsoDate) =>
      bounty
        ? `Bounty request — ${def.name}, ${incidentIsoDate}`
        : `Payout request — ${def.name}, ${incidentIsoDate}`,
  };
}

/** The def-driven adjudication pack — kind-templated criteria, doc-derived
 *  exclusions, the tier-max clause riding the verdict note (the copy doc's
 *  step 3 decision, blade-pack parity). */
export function buildAdjudicationPolicy(def: RiprapDef): AdjudicationPolicy {
  const exclusions = exclusionLines(def);
  return {
    id: def.slug,
    documentSlots: jurorSlots(def),
    samePersonRule: {
      statement:
        "The proofs that name a person must all name one person — the person on this membership.",
      tickLabel: "Same person throughout",
    },
    evidenceUseNote: "Evidence is used solely to adjudicate this request.",
    coverageCriteria:
      def.kind === "bounty"
        ? [
            "The qualifying act was performed, as the terms define it",
            "It happened during the pool's window",
            "It happened inside the pool's area",
            "The requester was an active member at the time",
          ]
        : [
            "The qualifying event happened, as the terms define it",
            "It happened during the pool's window",
            "It happened inside the pool's area",
            "The requester was an active member at the time",
          ],
    exclusions:
      exclusions.length > 0 ? exclusions : ["The request falls under an exclusion in the terms"],
    verdictNote:
      "The amount is as filed. The chain clamps it to the tier's maximum — the cap is the chain's job, not your question. An overpriced request can be denied outright.",
  };
}
