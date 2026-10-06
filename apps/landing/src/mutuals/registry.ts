// The pool registry — the dictionary linking every pool's detail route id
// (its on-chain MUTUAL pubkey once pinned, else its slug, see data.ts) to
// its detail page component. The Blade Pool keeps its full on-chain page
// (pool/BreakpointPage); the others are placeholder pages under ./pages
// until they deploy. Add a pool: data.ts entry + a page file + one line
// here; the router (`#/m/<id>`) picks it up.
import { type ComponentType, type LazyExoticComponent, lazy } from "react";

import { MUTUALS } from "./data";

const PoolRoute = lazy(() =>
  import("../pool/BreakpointPage").then((m) => ({ default: m.BreakpointPage })),
);
const Chairmageddon = lazy(() =>
  import("./pages/ChairmageddonPage").then((m) => ({ default: m.ChairmageddonPage })),
);
const NgmiHairline = lazy(() =>
  import("./pages/NgmiHairlinePage").then((m) => ({ default: m.NgmiHairlinePage })),
);
const CoffeeApocalypse = lazy(() =>
  import("./pages/CoffeeApocalypsePage").then((m) => ({ default: m.CoffeeApocalypsePage })),
);
const OnlyFriends = lazy(() =>
  import("./pages/OnlyFriendsPage").then((m) => ({ default: m.OnlyFriendsPage })),
);
const KeepRajWarm = lazy(() =>
  import("./pages/KeepRajWarmPage").then((m) => ({ default: m.KeepRajWarmPage })),
);
const LilysLifeline = lazy(() =>
  import("./pages/LilysLifelinePage").then((m) => ({ default: m.LilysLifelinePage })),
);
const TolyFuel = lazy(() =>
  import("./pages/TolyFuelPage").then((m) => ({ default: m.TolyFuelPage })),
);
const MertOfTheYear = lazy(() =>
  import("./pages/MertOfTheYearPage").then((m) => ({ default: m.MertOfTheYearPage })),
);

/** route id (`pubkey ?? slug`) → the pool's detail page. */
export const POOL_PAGES: Record<string, LazyExoticComponent<ComponentType>> = Object.fromEntries(
  MUTUALS.map((m) => {
    const id = m.pubkey ?? m.slug;
    const page = {
      "blade-pool": PoolRoute,
      "blade-pool-devnet": PoolRoute, // the devnet pin of the same pool (data.ts)
      chairmageddon: Chairmageddon,
      "ngmi-hairline": NgmiHairline,
      "coffee-apocalypse": CoffeeApocalypse,
      onlyfriends: OnlyFriends,
      "keep-raj-warm": KeepRajWarm,
      "lilys-liquid-lifeline": LilysLifeline,
      "toly-needs-his-fuel": TolyFuel,
      "mert-of-the-year": MertOfTheYear,
    }[m.slug];
    if (!page) throw new Error(`no detail page registered for pool ${m.name} (${m.slug})`);
    return [id, page];
  }),
);

/** The `<title>` for a pool's detail route. */
export function poolTitle(id: string): string | undefined {
  const pool = MUTUALS.find((m) => (m.pubkey ?? m.slug) === id);
  return pool ? `Riprap: ${pool.name}` : undefined;
}
