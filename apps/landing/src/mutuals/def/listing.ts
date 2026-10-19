// def → directory listing (milestone riprap-9bh4 HANDOFF §4): the derived
// listing a community mutual renders everywhere a first-party listing would
// (directory band, generic hero's join machine, route ids). The rule set is
// the store-resolution contract: name/kind/slug off the machine block, the
// tagline from marketing.blurb else a §3 excerpt, tiers with their names,
// smallestPayout from marketing else the lowest cap. No badge, no href —
// community pools carry no merchandising (D4).
import type { Address } from "@solana/kit";
import type { MutualListing } from "../types";
import type { RiprapDef } from "./schema";
import { paragraphs, parseSections, sectionByNo } from "./sections";

/** The §3 excerpt for the tagline when marketing.blurb is absent: the first
 *  sentence of the §3 prose (the covered event / qualifying act, named). */
function section3Excerpt(def: RiprapDef): string {
  const section = sectionByNo(parseSections(def.body), 3);
  const paras = section === null ? [] : paragraphs(section.body);
  // the canonical §3 opens with `**Name** means:` — the excerpt starts after
  const first = (/means:$/.test(paras[0] ?? "") ? paras[1] : paras[0]) ?? null;
  if (first === null) return def.name;
  const sentence = /^.*?[.!?](?=\s|$)/.exec(first);
  return sentence !== null ? (sentence[0] ?? def.name) : first;
}

/** The derived listing for an on-chain community mutual whose def resolved. */
export function listingFromDef(def: RiprapDef, address: Address): MutualListing {
  return {
    name: def.name,
    kind: def.kind,
    slug: def.slug,
    tagline: def.marketing?.blurb ?? section3Excerpt(def),
    tiers: def.tiers.map((t) => ({ name: t.name, fee: t.fee, cap: t.cap })),
    smallestPayout: def.marketing?.smallestPayout ?? Math.min(...def.tiers.map((t) => t.cap)),
    pubkey: address,
  };
}
