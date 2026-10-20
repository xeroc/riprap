import { lazy, StrictMode, Suspense, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Route, Routes, useLocation, useParams } from "react-router";
import "./index.css";
import App from "./App.tsx";
import { poolPageFor } from "./pools/registry.ts";
// The pool registry maps every `#/m/<id>` detail route (pubkey once pinned,
// else slug) to its page component (pools/registry.ts).
// One provider stack for every route (ADR-0007): a wallet connected on any
// surface stays connected on all of them. Pages stay lazy so route code
// keeps its own chunks.
import { SolanaProviders } from "./shared/providers.tsx";

const PoolRoute = lazy(() =>
  import("./pool/BreakpointPage.tsx").then((m) => ({ default: m.BreakpointPage })),
);
const MemberRoute = lazy(() => import("./app/AppPage.tsx").then((m) => ({ default: m.AppPage })));
const FileClaimRoute = lazy(() =>
  import("./app/file-claim/FileClaimPage.tsx").then((m) => ({ default: m.FileClaimPage })),
);
const AdjudicateRoute = lazy(() =>
  import("./adjudicate/AdjudicatePage.tsx").then((m) => ({ default: m.AdjudicatePage })),
);
const PoolsRoute = lazy(() =>
  import("./pools/PoolsPage.tsx").then((m) => ({ default: m.PoolsPage })),
);
const CreateRoute = lazy(() =>
  import("./create/CreatePage.tsx").then((m) => ({ default: m.CreatePage })),
);
const BlurbRoute = lazy(() =>
  import("./blurb/BlurbPage.tsx").then((m) => ({ default: m.BlurbPage })),
);

/** `#/app/file-claim/:pool` — the payout wizard for one pool: the id is the
 * pool's route id (`pubkey ?? slug`). Unknown ids land on the app surface
 * (the joined-pools table). `#/app/file-claim/:pool/restore/:nonce` is the
 * claim's read-only restore surface (copy doc § RESTORE). */
function FileClaimSurface() {
  const { pool, nonce } = useParams();
  return <FileClaimRoute pool={pool} restore={nonce} />;
}
/** `#/app/adjudicate` and `#/app/adjudicate/:dispute/:round` — the duty
 * board (mutual-agnostic: every pool the wallet joined, no pool in the
 * route) or the session shell; a non-numeric round or anything else under
 * the prefix is the board. */
function AdjudicateSurface() {
  const { dispute, round } = useParams();
  const session =
    dispute !== undefined && dispute !== "" && round !== undefined && /^\d+$/.test(round)
      ? { dispute, round: Number(round) }
      : null;
  return <AdjudicateRoute session={session} />;
}

/** `#/m/<id>` — a pool's detail route: the id is the pool's MUTUAL pubkey
 * once pinned, else its slug. Ids the founder directory pins get their
 * hand-written page; every other id lands on the generic def-driven page
 * (community pools — it renders honest states when the address holds no
 * mutual or the def isn't published). The route id rides down to the page:
 * pool pages that resolve by on-chain address take the id they were opened
 * at. */
function PoolSurface() {
  const { id } = useParams();
  if (id === undefined) return <App />;
  const Page = poolPageFor(id);
  return <Page id={id} />;
}

/** Route-scoped `<title>` swaps (copy doc § per-route Head lines): the
 * platform title is the default; routes that name their own reset it on
 * entry and on every hashchange back. */
const ROUTE_TITLES: Record<string, string> = {
  "/create": "Riprap: Create a pool",
  "/pools": "Riprap: Pools",
  "/mutuals": "Riprap: Pools", // the legacy alias renders the same page — same title
};
const PLATFORM_TITLE = "Riprap — purpose pools on Solana";

function RouteTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = ROUTE_TITLES[pathname] ?? PLATFORM_TITLE;
  }, [pathname]);
  return null;
}

/** In-page anchors ("#mechanism" clicked anywhere) land here as "/mechanism":
 * the browser's native anchor jump fires before the platform has settled, so
 * scroll once immediately and again right after. */
function PlatformSurface() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname === "/") return;
    const id = pathname.slice(1);
    const scroll = () => document.getElementById(id)?.scrollIntoView?.();
    const raf = requestAnimationFrame(scroll);
    const timer = setTimeout(scroll, 250);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [pathname]);
  return <App />;
}

export function Router() {
  return (
    <HashRouter>
      <RouteTitle />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<PlatformSurface />} />
          <Route path="/2026-breakpoint-blade-pool" element={<PoolRoute />} />
          <Route path="/pools" element={<PoolsRoute />} />
          {/* legacy alias — the 2026-10-20 purpose-pool pass renamed #/mutuals
              to #/pools; the old hash keeps resolving to the same page (the
              Blade Pool dual-route pattern one route up) */}
          <Route path="/mutuals" element={<PoolsRoute />} />
          <Route path="/m/:id" element={<PoolSurface />} />
          <Route path="/blurb" element={<BlurbRoute />} />
          <Route path="/create" element={<CreateRoute />} />
          <Route path="/app" element={<MemberRoute />} />
          <Route path="/app/file-claim/:pool/restore/:nonce" element={<FileClaimSurface />} />
          <Route path="/app/file-claim/:pool" element={<FileClaimSurface />} />
          <Route path="/app/adjudicate/:dispute/:round" element={<AdjudicateSurface />} />
          <Route path="/app/adjudicate/*" element={<AdjudicateSurface />} />
          <Route path="*" element={<PlatformSurface />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <SolanaProviders>
        <Router />
      </SolanaProviders>
    </StrictMode>,
  );
}
