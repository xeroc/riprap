import type { ReactElement } from "react";
import { lazy, StrictMode, Suspense, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

const PoolRoute = lazy(() => import("./pool/entry.tsx"));
const MemberRoute = lazy(() => import("./app/entry.tsx"));
const FileClaimRoute = lazy(() => import("./app/file-claim/entry.tsx"));
const BlurbRoute = lazy(() => import("./blurb/entry.tsx"));

/** "#/app/" matches "#/app"; "" / "#" / "#/" (and in-page anchors) are platform. */
function routeHash(hash: string): string | null {
  const trimmed = hash.replace(/\/+$/, "");
  return trimmed === "" || trimmed === "#" ? null : trimmed;
}

function matchRoute(hash: string | null): { title: string | null; element: ReactElement } {
  switch (hash) {
    case "#/2026-breakpoint-blade-pool":
      return { title: "Riprap: Blade Pool @ Breakpoint 2026", element: <PoolRoute /> };
    case "#/app":
      return { title: "Riprap: Blade Pool member app", element: <MemberRoute /> };
    case "#/app/file-claim":
      return { title: "Riprap: File a payout request", element: <FileClaimRoute /> };
    case "#/blurb":
      return { title: "Riprap: blurb & brand kit", element: <BlurbRoute /> };
    default:
      return { title: null, element: <App /> };
  }
}

// Captured from index.html's static <title> on first mount, restored on the
// platform route. Module-level (not state): the router must survive StrictMode
// double-mounts without re-capturing a route title as "platform".
let platformTitle: string | null = null;

export function Router() {
  const [hash, setHash] = useState(() => routeHash(window.location.hash));
  useEffect(() => {
    const onHashChange = () => setHash(routeHash(window.location.hash));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  const match = matchRoute(hash);
  useEffect(() => {
    platformTitle ??= document.title;
    document.title = match.title ?? platformTitle;
  }, [match.title]);
  // Cross-route anchors ("#mechanism" clicked on the pool/app routes): the
  // browser's native anchor jump fires before the lazy platform has mounted,
  // so scroll once immediately and again when the chunk has landed.
  useEffect(() => {
    if (hash === null || hash.startsWith("#/")) return;
    const id = hash.slice(1);
    const scroll = () => document.getElementById(id)?.scrollIntoView?.();
    const raf = requestAnimationFrame(scroll);
    const timer = setTimeout(scroll, 250);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [hash]);
  return <Suspense fallback={null}>{match.element}</Suspense>;
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Router />
    </StrictMode>,
  );
}
