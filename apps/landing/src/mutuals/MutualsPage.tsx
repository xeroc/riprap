// /mutuals — the tabular directory (copy doc § /mutuals). One row per LIVE
// pool (copy doc § /mutuals v13): the store scans the hanse program and
// resolves each on-chain mutual against the pubkeys pinned in data.ts, so a
// pool appears exactly when it exists on the active cluster — drafts never
// render, on-chain mutuals without a listing are not shown. State lines
// shared with the §1.2 band: reading `Reading the pools from the chain.` ·
// unreachable `Couldn't reach the cluster.` + `Try again` · nothing live
// `No pools are live on this cluster yet.`. The first column is the badge
// rail (copy doc § /mutuals v12): full-height strips rotated 90°, zero
// spacing — BP26, founder badge, kind. Every name links to the pool's
// detail route (#/m/<pubkey-or-slug>). Wayfinding: shared navbar + footer.
import { Button, SectionBand } from "@riprap/ui";
import { SiteNav } from "../components/SiteNav";
import { Footer } from "../sections/Footer";
import { capSymbol, entryRange, poolRoute } from "./data";
import { PoolBadgeRail } from "./PoolBadgeRail";
import { useMutualStore } from "./store";

export function MutualsPage() {
  const store = useMutualStore();
  const pools = store.state === "ready" ? store.pools : [];

  return (
    <>
      <SiteNav />
      <main>
        <SectionBand id="mutuals-table" label="the pools" tone="ground">
          <div className="flex flex-col gap-(--riprap-space-xl)">
            <div className="flex max-w-2xl flex-col gap-4">
              <h1 className="tracking-(--riprap-tracking-display) text-ink [font:var(--riprap-display-lg)]">
                Purpose Pools
              </h1>
              <p className="leading-relaxed text-muted-foreground [font:var(--riprap-body-md)]">
                Every pool on Riprap, with its purpose. Some protect as mutuals, some reward as
                bounties. The underlying program is the same, the purpose different.
              </p>
            </div>

            {store.state === "error" ? (
              <div className="flex max-w-2xl flex-col gap-2">
                <p className="text-ink [font:var(--riprap-body-md)]">Couldn't reach the cluster.</p>
                <Button variant="outline" className="w-44" onClick={store.retry}>
                  Try again
                </Button>
              </div>
            ) : pools.length === 0 ? (
              <p className="max-w-2xl leading-relaxed text-muted-foreground [font:var(--riprap-body-md)]">
                {store.state === "ready"
                  ? "No pools are live on this cluster yet."
                  : "Reading the pools from the chain."}
              </p>
            ) : (
              <>
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
                    {pools.map(({ listing: pool }) => (
                      <tr key={pool.name} className="border-b border-hairline last:border-b-0">
                        <td className="relative h-24 p-0 pr-18">
                          <PoolBadgeRail pool={pool} />
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
                        <td
                          data-num
                          className="py-4 pr-4 font-mono text-sm whitespace-nowrap text-ink"
                        >
                          {entryRange(pool)}
                        </td>
                        <td
                          data-num
                          className="py-4 px-2 font-mono text-sm whitespace-nowrap text-ink"
                        >
                          <span className="bg-accent p-1 px-2.5 text-xl">{capSymbol(pool)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <p className="max-w-2xl leading-relaxed text-muted-soft [font:var(--riprap-body-sm)]">
                  Prices are the tier tables of each pool's policy or terms document. Bounties and
                  Mutuals come with their own purpose-specific pool. One uses it for bounties, the
                  other pool protects from risks. Both pay for verified acts or events through the
                  same on-chain adjudication.
                </p>
              </>
            )}
          </div>
        </SectionBand>
      </main>
      <Footer />
    </>
  );
}

export default MutualsPage;
