import { POOLS, poolRouteId } from "../pools/data";
import { slugify } from "./doc";

function routeIdTaken(slug: string): boolean {
  // the route id first (an unpinned pool's slug still routes), then the
  // slug itself — a listed slug stays the pool's identity after its
  // address pins, so a new pool never reuses it
  return POOLS.some((p) => poolRouteId(p) === slug || p.slug === slug);
}

/** The draft's slug, always derived from the name (2026-10-21 founder
 * pass — the editable field is retired): kebab-case via slugify; a
 * collision with a listed pool appends a counter (-2, -3, …); a name
 * with nothing slugable falls back to "pool". The slug is the pool's
 * route id until its address pins. */
export function poolSlug(name: string): string {
  const base = slugify(name) || "pool";
  let slug = base;
  for (let n = 2; routeIdTaken(slug); n++) slug = `${base}-${n}`;
  return slug;
}
