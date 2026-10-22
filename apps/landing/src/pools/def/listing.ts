// def → directory listing (milestone riprap-9bh4 HANDOFF §4): the derived
// listing a community mutual renders everywhere a first-party listing would
// (directory band, generic hero's join machine, route ids). The rule set is
// the store-resolution contract: name/kind/slug off the machine block, the
// tagline from marketing.blurb else the legacy §3 excerpt else the body's
// first prose paragraph, tiers with their names, smallestPayout from
// marketing else the lowest cap. No badge, no href — community pools carry
// no merchandising (D4).
import type { Address } from "@solana/kit";
import type { PoolListing } from "../types";
import type { RiprapDef } from "./schema";
import { paragraphs, parseSections, sectionByNo } from "./sections";

function sentence(text: string): string {
  const match = /^.*?[.!?](?=\s|$)/.exec(text);
  return match?.[0] ?? text;
}

/** The first non-heading, non-list paragraph of a markdown block, plain
 *  text — the tagline fallback for a free-form body. */
function firstProse(body: string): string | null {
  for (const raw of body.split(/\n{2,}/)) {
    const block = raw.trim();
    if (block === "") continue;
    if (/^#{1,6}\s/.test(block)) continue;
    if (/^(?:[-*+]|\d+\.)\s/.test(block)) continue;
    if (/^>/.test(block) || /^\|/.test(block)) continue;
    const text = block
      .replace(/\*\*|\*|__/g, "")
      .replace(/(^|\n)> ?/g, "$1")
      .trim();
    if (text !== "") return text;
  }
  return null;
}

/** The tagline when marketing.blurb is absent: the legacy §3 excerpt (the
 *  covered event / qualifying act, named), else the free-form body's first
 *  prose paragraph. */
function taglineExcerpt(def: RiprapDef): string {
  const section = sectionByNo(parseSections(def.body), 3);
  if (section !== null) {
    const paras = paragraphs(section.body);
    // the canonical §3 opens with `**Name** means:` — the excerpt starts after
    const first = (/means:$/.test(paras[0] ?? "") ? paras[1] : paras[0]) ?? null;
    if (first !== null) return sentence(first);
  }
  const bodyFirst = firstProse(def.body);
  return bodyFirst !== null ? sentence(bodyFirst) : def.name;
}

/** The derived listing for an on-chain community mutual whose def resolved. */
export function listingFromDef(def: RiprapDef, address: Address): PoolListing {
  return {
    name: def.name,
    kind: def.kind,
    slug: def.slug,
    tagline: def.marketing?.blurb ?? taglineExcerpt(def),
    tiers: def.tiers.map((t) => ({ name: t.name, fee: t.fee, cap: t.cap })),
    smallestPayout: def.marketing?.smallestPayout ?? Math.min(...def.tiers.map((t) => t.cap)),
    pubkey: address,
  };
}
