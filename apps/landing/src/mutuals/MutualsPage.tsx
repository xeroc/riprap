// /mutuals — the tabular directory (copy doc § /mutuals). One row per pool
// from meta/Breakpoint's policy/terms docs: prices are the docs' §5 tables
// (all but Blade Pool, NGMI Hairline, and Mert of the Year still
// TODO-confirm — the footnote says so). The first column is the badge rail
// (copy doc § /mutuals v12): full-height strips rotated 90°, zero spacing —
// BP26, founder badge, kind. No status column —
// all pools go live together when they go on-chain. Every name links to the
// pool's detail route (#/m/<pubkey-or-slug>). Wayfinding: shared navbar +
// footer.
import { SectionBand } from "@riprap/ui";
import { BpBadge } from "../components/BpBadge";
import { SiteNav } from "../components/SiteNav";
import { Footer } from "../sections/Footer";
import { capSymbol, entryRange, MUTUALS, poolRoute } from "./data";

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

            <table className="w-full border-collapse">
              <caption className="sr-only">
                All Riprap pools: what each covers or pays for, entry fees, maximum payouts.
              </caption>
              <thead>
                <tr className="border-b border-hairline text-left">
                  {/* biome-ignore lint/a11y/noAriaHiddenOnFocusable: empty decorative strip column — th is not focusable, biome's heuristic over-reaches */}
                  <th aria-hidden="true" className="w-[18px] p-0" />
                  {["Pool", "Covers", "Entry", "Max payout"].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className={`pb-3 pr-4 uppercase tracking-(--riprap-tracking-stamp) text-muted-soft [font:var(--riprap-mono-label)] last:pr-0${h === "Covers" ? " hidden sm:table-cell" : ""}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MUTUALS.map((pool) => (
                  <tr key={pool.name} className="border-b border-hairline last:border-b-0">
                    {/* the badge rail (copy doc § /mutuals v12): full-height
                        strips rotated 90°, side by side, zero spacing — BP26
                        on the event pink, the founder badge when present (the
                        founder badge when present, then the kind
                        strip. */}
                    <td className="relative h-24 p-0 pr-18">
                      <div className="absolute inset-y-0 left-0 flex">
                        <div className="relative w-5 overflow-hidden">
                          <span
                            aria-hidden="true"
                            className="absolute inset-0 bg-(--bp-2026-pink)"
                          />
                          <BpBadge className="absolute top-1/2 left-1/2 w-max -translate-x-1/2 -translate-y-1/2 rotate-90" />
                        </div>
                        <div className="relative w-5 overflow-hidden border-x border-hairline bg-card">
                          <span className="absolute top-1/2 left-1/2 w-max -translate-x-1/2 -translate-y-1/2 rotate-90 px-2 uppercase tracking-(--riprap-tracking-stamp) text-muted-soft [font:var(--riprap-mono-label)]">
                            {pool.kind}
                          </span>
                        </div>
                        {pool.badge ? (
                          <div className="relative w-5 overflow-hidden bg-accent">
                            <span className="absolute top-1/2 left-1/2 w-max -translate-x-1/2 -translate-y-1/2 rotate-90 px-2 py-0.5 text-ink uppercase tracking-(--riprap-tracking-stamp) [font:var(--riprap-mono-label)]">
                              {pool.badge}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <th scope="row" className="py-4 pr-4 text-left">
                      <a
                        href={poolRoute(pool)}
                        className="font-medium text-ink underline decoration-transparent underline-offset-4 transition-colors hover:decoration-current [font:var(--riprap-body-sm)]"
                      >
                        {pool.name}
                      </a>
                    </th>
                    <td className="hidden py-4 pr-4 text-body sm:table-cell [font:var(--riprap-body-sm)]">
                      {pool.tagline}
                    </td>
                    <td data-num className="py-4 pr-4 font-mono text-sm whitespace-nowrap text-ink">
                      {entryRange(pool)}
                    </td>
                    <td data-num className="py-4 px-2 font-mono text-sm whitespace-nowrap text-ink">
                      <span className="bg-accent p-1 px-2.5 text-xl">{capSymbol(pool)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="max-w-2xl leading-relaxed text-muted-soft [font:var(--riprap-body-sm)]">
              Prices are the tier tables of each pool's policy or terms document. Bounties share not
              risk but bounty pool - they pay for verified acts, on the same rails as the mutuals.
            </p>
          </div>
        </SectionBand>
      </main>
      <Footer />
    </>
  );
}

export default MutualsPage;
