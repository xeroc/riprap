// /mutuals — the tabular directory (copy doc § /mutuals). One row per pool
// from meta/Breakpoint's Micro Mutual policy docs: tier prices are policy §5
// (draft prices still TODO-confirm in three policies — the footnote says
// so). Wayfinding: the shared navbar + footer; the pool row links to the
// pool's instance surface when one exists.
import { SectionBand } from "@riprap/ui";
import { SiteNav } from "../components/SiteNav";
import { Footer } from "../sections/Footer";
import { capRange, entryRange, MUTUAL_EVENT, MUTUALS } from "./data";

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
                Every pool on Riprap, with its terms. All pools in the first batch run at{" "}
                {MUTUAL_EVENT.event} — {MUTUAL_EVENT.venue}, {MUTUAL_EVENT.window}.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[48rem] border-collapse">
                <caption className="sr-only">
                  All Riprap pools: what each covers, entry fees, maximum payouts, status.
                </caption>
                <thead>
                  <tr className="border-b border-hairline text-left">
                    {["Pool", "Covers", "Entry", "Max payout", "Status"].map((h) => (
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
                      <th
                        scope="row"
                        className="py-4 pr-4 text-left align-top font-medium whitespace-nowrap text-ink [font:var(--riprap-body-sm)]"
                      >
                        {pool.href ? (
                          <a href={pool.href} className="text-accent underline underline-offset-4">
                            {pool.name}
                          </a>
                        ) : (
                          pool.name
                        )}
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
                        className="py-4 pr-4 align-top font-mono text-sm whitespace-nowrap text-ink"
                      >
                        {capRange(pool)}
                      </td>
                      <td className="py-4 align-top uppercase tracking-(--riprap-tracking-stamp) text-muted-soft [font:var(--riprap-mono-label)]">
                        {pool.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="max-w-2xl leading-relaxed text-muted-soft [font:var(--riprap-body-sm)]">
              Prices are the tier tables of each pool's policy document. The three draft pools'
              prices are still marked TODO-confirm in their policies; the Blade Pool's are final.
            </p>
          </div>
        </SectionBand>
      </main>
      <Footer />
    </>
  );
}

export default MutualsPage;
