// GenericPoolPage — the detail route every def-driven community pool renders
// (epic riprap-hs4r, D5): unknown `#/m/<pubkey>` ids land here when the
// registry has no hand-written page. The route id is the on-chain MUTUAL
// address; the page resolves the mutual, derives its domain_ref, pulls the
// anchored def doc off the evidence daemon's CAS, and renders PoolPageShell +
// GenericPoolHero from it. Every failure state is honest and terminal — 404
// from the CAS is a state ("not published yet"), a def that doesn't parse is
// a state, and there is never fallback content (kit data law).

import { Button, SectionBand } from "@riprap/ui";
import { type Address, isAddress } from "@solana/kit";

import { SiteNav } from "../../components/SiteNav";
import { Footer } from "../../sections/Footer";
import { listingFromDef } from "../def/listing";
import type { RiprapDef } from "../def/schema";
import {
  listItems,
  paragraphs,
  parseSections,
  quoteLines,
  sectionByHeading,
  sectionByNo,
} from "../def/sections";
import { usePoolDef } from "../def/usePoolDef";
import type { PoolListing } from "../types";
import { GenericPoolHero } from "./GenericPoolHero";
import { type PoolPageConfig, PoolPageShell } from "./PoolPageShell";

/** Platform-wide promise lines — hard-coded, numberless (zero-numbers law),
 *  never synthesized from the doc. */
const KIND_PROMISE: Record<RiprapDef["kind"], string[]> = {
  mutual: [
    "Join a temporary community pool.",
    "Pay a fixed amount.",
    "Receive a defined payment if the covered event happens.",
    "If payments don't consume the pool, the remaining money comes back to the members.",
    "When the event is over, the pool ends.",
  ],
  bounty: [
    "Join a temporary bounty pool.",
    "Pay a fixed amount.",
    "Get paid for proof of the qualifying act.",
    "If bounties don't consume the pot, the remaining money comes back to the members.",
    "When the event is over, the bounty ends.",
  ],
};

/** Platform-wide winding-up note — same shape as the hand-written pages'
 *  endNotes, numberless, never synthesized from the doc. */
function kindEndNote(kind: RiprapDef["kind"]): string {
  return kind === "bounty"
    ? "After the event, the claim window, and settlement, the remaining balance returns to eligible members and the bounty pool dissolves permanently."
    : "After the event, the claim window, and settlement, the remaining balance returns to eligible members and the pool dissolves permanently.";
}

/** §10's example figures → receipt lines: `Label: **$X**` pairs, bold-only
 *  lines split into value + caption. Numbers verbatim from the doc bytes. */
function receiptPairs(body: string): { value: string; caption: string }[] {
  const pairs: { value: string; caption: string }[] = [];
  for (const raw of body.split("\n")) {
    const line = raw.trim();
    const m = /^(?:(.*?):\s*)?\*\*(.+?)\*\*$/.exec(line);
    if (m === null) continue;
    const prefix = (m[1] ?? "").trim();
    const bold = (m[2] ?? "").trim();
    if (prefix.length > 0) {
      pairs.push({ value: bold, caption: prefix });
      continue;
    }
    const colon = bold.lastIndexOf(": ");
    if (colon !== -1) {
      pairs.push({
        value: bold.slice(colon + 2),
        caption: bold.slice(0, colon),
      });
      continue;
    }
    const lead = /^([\d,$.\s×–—/-]+?)\s+(.+)$/.exec(bold);
    if (lead !== null) {
      pairs.push({
        value: (lead[1] ?? "").trim(),
        caption: (lead[2] ?? "").trim(),
      });
    }
  }
  return pairs;
}

/** The §10 worked example — receipt lines, the "remaining" figure as the
 *  total, the closing prose as the note. Null when the legacy § is absent
 *  or carries no figures; a free-form doc gets no receipt. */
function exampleFromDef(def: RiprapDef): NonNullable<PoolPageConfig["example"]> | null {
  const section = sectionByNo(parseSections(def.body), 10);
  if (section === null) return null;
  const pairs = receiptPairs(section.body);
  if (pairs.length === 0) return null;
  const total = pairs.find((p) => /remaining/i.test(p.caption)) ?? pairs[pairs.length - 1];
  const note = paragraphs(section.body).at(-1) ?? "";
  return { lines: pairs, total, note };
}

/** Legacy §3 → the verbatim definition (its blockquote, else the first
 *  paragraph) plus the definition notes. A free-form body has no §3: the
 *  whole body is the terms, rendered as markdown (`terms: true`). */
function definitionFromDef(def: RiprapDef): {
  definition: string;
  definitionNotes: string[];
  terms: boolean;
} {
  const section = sectionByNo(parseSections(def.body), 3);
  if (section === null) {
    return {
      definition: def.body.trim() !== "" ? def.body : def.name,
      definitionNotes: [],
      terms: true,
    };
  }
  const quote = quoteLines(section.body)[0] ?? null;
  const paras = paragraphs(section.body);
  const lead = /means:$/.test(paras[0] ?? "");
  const definition = quote ?? (lead ? paras[1] : paras[0]) ?? def.name;
  const drop = quote === null ? (lead ? 2 : 1) : lead ? 1 : 0;
  return {
    definition,
    definitionNotes: [...listItems(section.body), ...paras.slice(drop)],
    terms: false,
  };
}

/** The doc's `## Exclusions` block (numbered or not), list order unless the
 *  author wrote prose. */
function exclusionsFromDef(def: RiprapDef): string[] {
  const section = sectionByHeading(def.body, /exclusions?/i);
  if (section === null) return [];
  const items = listItems(section.body);
  return items.length > 0 ? items : paragraphs(section.body);
}

/** The def → PoolPageConfig projection. Doc bands carry the doc's own numbers
 *  (terms, not UI); the promise and end note are platform-wide, never
 *  synthesized from the doc. */
export function poolPageConfigFromDef(def: RiprapDef, listing: PoolListing): PoolPageConfig {
  const sections = parseSections(def.body);
  const covered = definitionFromDef(def);
  const claims = sectionByNo(sections, 7);
  const example = exampleFromDef(def);
  const feeNote =
    (claims !== null
      ? paragraphs(claims.body).find((p) => /adjudication fee/i.test(p))
      : undefined) ??
    "Filing pre-pays an adjudication fee; a denied claim forfeits it, an approved one returns it with the payment.";
  return {
    name: def.name,
    event: def.marketing?.event ?? "Community",
    kind: def.kind,
    tagline: listing.tagline,
    promise: KIND_PROMISE[def.kind],
    tiers: def.tiers.map((t) => ({ name: t.name, fee: t.fee, cap: t.cap })),
    slug: def.slug,
    definition: covered.definition,
    definitionNotes: covered.definitionNotes,
    terms: covered.terms,
    exclusions: exclusionsFromDef(def),
    proof: def.proof.map((p) => p.label ?? p.slot),
    feeNote,
    example: example ?? undefined,
    endNote: kindEndNote(def.kind),
    caveat: "Terms are the doc's, verbatim — the on-chain policy hash pins them.",
  };
}

/** One honest terminal/loading state, full-page — no fallback content. */
function GenericBand({
  label,
  title,
  children,
  retry,
}: {
  label: string;
  title: string;
  children?: React.ReactNode;
  retry?: () => void;
}) {
  return (
    <>
      <SiteNav />
      <main>
        <SectionBand id="pool" label={label} tone="ground">
          <div className="flex max-w-3xl flex-col gap-3 pt-(--riprap-space-section) pb-(--riprap-space-section)">
            <h1 className="tracking-(--riprap-tracking-display) text-ink [font:var(--riprap-display-md)]">
              {title}
            </h1>
            {children}
            {retry !== undefined ? (
              <Button variant="outline" className="w-44" onClick={retry}>
                Try again
              </Button>
            ) : null}
          </div>
        </SectionBand>
      </main>
      <Footer />
    </>
  );
}

export function GenericPoolPage({ id }: { id?: string }) {
  // the generic page only ever opens at an unknown route id — for community
  // pools that is the on-chain MUTUAL pubkey
  const address = id !== undefined && isAddress(id) ? (id as Address) : null;
  const resolution = usePoolDef(address);

  if (address === null) {
    return (
      <GenericBand label="pool" title="No pool at this address.">
        <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
          This link doesn't point at a riprap pool.
        </p>
      </GenericBand>
    );
  }
  switch (resolution.state) {
    case "pool-loading":
      return (
        <GenericBand label="pool" title="Reading the pool from the chain.">
          <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
            The pool account and its pinned terms take a moment.
          </p>
        </GenericBand>
      );
    case "pool-error":
      return (
        <GenericBand label="pool" title="Couldn't reach the cluster." retry={resolution.retry}>
          <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
            The read failed before anything could render.
          </p>
        </GenericBand>
      );
    case "not-found":
      return (
        <GenericBand label="pool" title="No pool at this address.">
          <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
            This address holds no riprap pool on the active cluster. It may have dissolved, or the
            link is wrong.
          </p>
        </GenericBand>
      );
    case "doc-loading":
      return (
        <GenericBand label="pool" title="Reading the terms from the evidence server.">
          <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
            The doc this pool's policy hash pins, served content-addressed.
          </p>
        </GenericBand>
      );
    case "doc-error":
      return (
        <GenericBand
          label="pool"
          title="Couldn't reach the evidence server."
          retry={resolution.retry}
        >
          <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
            The terms read failed before anything could render.
          </p>
        </GenericBand>
      );
    case "missing":
      return (
        <GenericBand label="pool" title="Not published yet.">
          <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
            The terms this pool pins aren't on the evidence server, so there is nothing to render.
          </p>
        </GenericBand>
      );
    case "not-a-def":
      return (
        <GenericBand label="pool" title="The published terms aren't a riprap def.">
          <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
            This pool anchored a document this surface can't render.
          </p>
        </GenericBand>
      );
  }

  const listing = listingFromDef(resolution.def, address);
  return (
    <PoolPageShell
      config={poolPageConfigFromDef(resolution.def, listing)}
      hero={<GenericPoolHero listing={listing} def={resolution.def} />}
      policyAddress={address}
    />
  );
}

export default GenericPoolPage;
