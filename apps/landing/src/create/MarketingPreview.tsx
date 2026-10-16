// MarketingPreview.tsx — the #/create marketing band's live preview: the
// draft's def projected onto the pool page's hero offer (PoolHeroOffer —
// the same component the deployed pool page renders), drawn scaled beside
// the form. No chain reads: every figure is the draft's own bytes (the
// doc's terms, not invented UI numbers); the join column is a stand-in
// note — the join machine needs a deployed pool.
import { usd } from "@riprap/ui";

import type { RiprapDef } from "../mutuals/def/schema";
import { PoolHeroOffer } from "../mutuals/pages/GenericPoolHero";
import { defaultTierIndex } from "../mutuals/pages/usePoolJoin";
import type { DefDoc } from "./doc";

const PARAM = "{{PARAM}}";

/** The draft def on the parsed-def shape the pool surfaces consume (the
 * period key is snake_case in the artifact). */
function previewDef(def: DefDoc): RiprapDef {
  return {
    schema: "riprap-def/v1",
    kind: def.kind,
    slug: def.slug,
    name: def.name,
    period: {
      start: def.period.start,
      end: def.period.end,
      claims_close: def.period.claimsClose,
      venue: def.period.venue,
    },
    tiers: def.tiers,
    proof: def.proof,
    marketing: def.marketing,
    language: def.language,
    body: "",
  };
}

/** Scaled to 70%, hairline-framed, breathing room inside the frame — the
 * marketing fields as the pool page will carry them: stamp + when,
 * headline, blurb, logo, the tier line. */
export function MarketingPreview({ def }: { def: DefDoc }) {
  const tier = def.tiers[defaultTierIndex(def.tiers.length)] ?? null;
  return (
    <aside
      data-slot="marketing-preview"
      aria-label="Pool page preview"
      className="border border-hairline bg-ground xl:sticky xl:top-24"
    >
      <p className="border-b border-hairline px-4 py-2 text-muted-soft uppercase tracking-(--riprap-tracking-stamp) [font:var(--riprap-mono-label)]">
        The pool page — preview at 70%
      </p>
      <div className="overflow-hidden p-6" style={{ zoom: 0.7 }}>
        <PoolHeroOffer
          def={previewDef(def)}
          fee={tier !== null ? usd(tier.fee) : PARAM}
          cap={tier !== null ? usd(tier.cap) : PARAM}
          headingLevel={2}
          stacked
          below={
            <div className="flex flex-col gap-3 pt-(--riprap-space-sm)">
              <p data-num className="font-mono text-base text-ink">
                {tier !== null
                  ? `${tier.name} · ${usd(tier.fee)} entry · up to ${usd(tier.cap)} maximum payout`
                  : PARAM}
              </p>
              <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
                The join controls land here when the pool deploys.
              </p>
            </div>
          }
        />
      </div>
    </aside>
  );
}
