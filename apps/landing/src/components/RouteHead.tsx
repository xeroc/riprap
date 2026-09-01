// Per-route head tags for client-routed pages. The platform route carries its
// head statically in index.html; this swaps title/description/canonical/OG
// and injects route JSON-LD when the pool page mounts (navigation is full
// page loads, so no unmount cleanup is needed). Pass module-level constants
// so the effect deps stay stable and it runs once.
import { useEffect } from "react";

const SITE = "https://riprap.xyz";

type RouteHeadProps = {
  title: string;
  description: string;
  path: string;
  jsonLd?: readonly Record<string, unknown>[];
};

function setMeta(selector: string, attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function RouteHead({ title, description, path, jsonLd }: RouteHeadProps) {
  useEffect(() => {
    const url = `${SITE}${path}`;
    document.title = title;
    setMeta('meta[name="description"]', "name", "description", description);
    setMeta('meta[property="og:title"]', "property", "og:title", title);
    setMeta('meta[property="og:description"]', "property", "og:description", description);
    setMeta('meta[property="og:url"]', "property", "og:url", url);
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);
    document.getElementById("route-jsonld")?.remove();
    if (jsonLd) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = "route-jsonld";
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [title, description, path, jsonLd]);
  return null;
}
