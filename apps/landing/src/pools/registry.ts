// The pool registry — the dictionary linking every pool's detail route id
// (its on-chain MUTUAL pubkey once pinned, else its slug, see data.ts) to
// its detail page component. The Blade Pool keeps its full on-chain page
// (pool/BreakpointPage); the others are placeholder pages under ./pages
// until they deploy. Add a pool: data.ts entry + a page file + one line
// here; the router (`#/m/<id>`) picks it up. Ids the directory doesn't pin
// fall through to the generic def-driven page (poolPageFor, epic
// riprap-hs4r) — community pools with a published riprap-def/v1 doc.
import { type ComponentType, type LazyExoticComponent, lazy } from "react";

import { POOLS } from "./data";

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
const CaffeineSupercycle = lazy(() =>
  import("./pages/CaffeineSupercyclePage").then((m) => ({ default: m.CaffeineSupercyclePage })),
);
const MertOfTheYear = lazy(() =>
  import("./pages/MertOfTheYearPage").then((m) => ({ default: m.MertOfTheYearPage })),
);

// The community pools' page — any `#/m/<id>` the founder directory doesn't
// pin (epic riprap-hs4r, D5): the generic page resolves the mutual on-chain,
// pulls its anchored def off the evidence CAS, and renders from the def.
// First-party pools keep their hand-written pages and rank.
const GenericPool = lazy(() =>
  import("./pages/GenericPoolPage").then((m) => ({ default: m.GenericPoolPage })),
);

/** A pool page receives the route id it was opened at (`pubkey ?? slug`) —
 *  pages that resolve their pool by on-chain address (the Blade Pool's,
 *  per-cluster pins) use it; the draft pages know their pool by slug. */
export type PoolPage = LazyExoticComponent<ComponentType<{ id?: string }>>;

/** route id (`pubkey ?? slug`) → the pool's detail page. */
export const POOL_PAGES: Record<string, PoolPage> = Object.fromEntries(
  POOLS.map((m) => {
    const id = m.pubkey ?? m.slug;
    const page = {
      "blade-pool": PoolRoute,
      chairmageddon: Chairmageddon,
      "ngmi-hairline": NgmiHairline,
      "coffee-apocalypse": CoffeeApocalypse,
      onlyfriends: OnlyFriends,
      "keep-raj-warm": KeepRajWarm,
      "lilys-liquid-lifeline": LilysLifeline,
      "toly-needs-his-fuel": TolyFuel,
      "mert-of-the-year": MertOfTheYear,
      "caffeine-supercycle": CaffeineSupercycle,
    }[m.slug];
    if (!page) throw new Error(`no detail page registered for pool ${m.name} (${m.slug})`);
    return [id, page];
  }),
);

/** The detail page for a route id: the pinned page when the founder
 *  directory knows it, else the generic def-driven page — every on-chain
 *  mutual with a published def renders, community pools included. */
export function poolPageFor(id: string): PoolPage {
  return POOL_PAGES[id] ?? GenericPool;
}
