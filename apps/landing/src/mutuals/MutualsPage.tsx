// /mutuals — the tabular directory (copy doc § /mutuals). One row per pool
// from meta/Breakpoint's policy/terms docs: prices are the docs' §5 tables
// (all but Blade Pool still TODO-confirm — the footnote says so). The kind
// renders under the pool's name, not as its own column; no status column —
// all pools go live together when they go on-chain. Every name links to the
// pool's detail route (#/m/<pubkey-or-slug>). Wayfinding: shared navbar +
// footer.
import { SectionBand } from "@riprap/ui";
import { BpBadge } from "../components/BpBadge";
import { SiteNav } from "../components/SiteNav";
import { Footer } from "../sections/Footer";
import { capRange, entryRange, MUTUALS, poolRoute } from "./data";

export function MutualsPage() {
  return (
    <>
      <SiteNav />
      <main>
        <SectionBand id="mutuals-table" label="the pools" tone="ground">
          <div className="flex flex-col gap-(--riprap-space-xl)">
            <div className="flex max-w-2xl flex-col gap-4">
              <h1 className="tracking-(--riprap-tracking-display) text-ink [font:var(--riprap-display-lg)]">
                Mutuals.
              </h1>
              <p className="leading-relaxed text-muted-foreground [font:var(--riprap-body-md)]">
                Every pool on Riprap, with its terms.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[44rem] border-collapse">
                <caption className="sr-only">
                  All Riprap pools: what each covers or pays for, entry fees, maximum payouts.
                </caption>
                <thead>
                  <tr className="border-b border-hairline text-left">
                    {["Pool", "Covers", "Entry", "Max payout"].map((h) => (
                      <th
                        key={h}
                        scope="col"
                        className="pb-3 pr-4 uppercase tracking-(--riprap-tracking-stamp) text-muted-soft [font:var(--riprap-mono-label)] last:pr-0"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MUTUALS.map((pool) => (
                    <tr key={pool.name} className="border-b border-hairline last:border-b-0">
                      <th scope="row" className="py-4 pr-4 text-left align-top">
                        <a
                          href={poolRoute(pool)}
                          className="font-medium whitespace-nowrap text-ink underline decoration-transparent underline-offset-4 transition-colors hover:decoration-current [font:var(--riprap-body-sm)]"
                        >
                          {pool.name}
                        </a>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <BpBadge className="h-[16px]" />
                          {pool.badge ? (
                            <span className="border border-accent px-1.5 py-0.5 uppercase tracking-(--riprap-tracking-stamp) text-accent [font:var(--riprap-mono-label)]">
                              {pool.badge}
                            </span>
                          ) : null}
                          <span className="uppercase tracking-(--riprap-tracking-stamp) text-muted-soft [font:var(--riprap-mono-label)]">
                            {pool.kind}
                          </span>
                        </div>
                      </th>
                      <td className="py-4 pr-4 align-top text-body [font:var(--riprap-body-sm)]">
                        {pool.tagline}
                      </td>
                      <td
                        data-num
                        className="py-4 pr-4 align-top font-mono text-sm whitespace-nowrap text-ink"
                      >
                        {entryRange(pool)}
                      </td>
                      <td
                        data-num
                        className="py-4 align-top font-mono text-sm whitespace-nowrap text-ink"
                      >
                        {capRange(pool)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="max-w-2xl leading-relaxed text-muted-soft [font:var(--riprap-body-sm)]">
              Prices are the tier tables of each pool's policy or terms document; every pool except
              the Blade Pool is still marked TODO-confirm there. Bounties share no risk — they pay
              for verified acts, on the same rails as the mutuals.
            </p>
          </div>
        </SectionBand>
      </main>
      <Footer />
    </>
  );
}

export default MutualsPage;
