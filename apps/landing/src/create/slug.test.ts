import { describe, expect, it } from "vitest";

import { POOLS } from "../pools/data";
import { poolSlug } from "./slug";

// The slug derives from the name (2026-10-21 founder pass — the editable
// field is retired): kebab-case, counter on collision with a listed pool's
// route id, "pool" when the name has nothing slugable.
describe("poolSlug — the derived route id", () => {
  it("kebab-cases the name", () => {
    expect(poolSlug("A Brand New Pool")).toBe("a-brand-new-pool");
  });

  it("appends a counter when a listed pool already owns the route id", () => {
    // the directory's first batch pins these slugs (data.ts)
    const listed = POOLS.map((p) => p.slug);
    expect(listed).toContain("chairmageddon");
    expect(listed).toContain("blade-pool");
    expect(poolSlug("Chairmageddon")).toBe("chairmageddon-2");
    expect(poolSlug("Blade Pool")).toBe("blade-pool-2");
  });

  it("falls back to pool when the name has nothing slugable", () => {
    expect(poolSlug("!!!")).toBe("pool");
    expect(poolSlug("")).toBe("pool");
  });

  it("folds accents and ligatures like slugify", () => {
    expect(poolSlug("Straße Café")).toBe("strasse-cafe");
  });
});
