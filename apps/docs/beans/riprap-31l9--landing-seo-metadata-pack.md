---
# riprap-31l9
title: Landing SEO metadata pack
status: completed
type: task
priority: normal
created_at: 2026-09-01T15:41:14Z
updated_at: 2026-09-01T15:49:12Z
---

Static SEO metadata for apps/landing: OG/Twitter/canonical, robots.txt, sitemap.xml, JSON-LD (Organization/WebSite + per-route Event), og.png 1200x630, llms.txt with Breakpoint policy details. No prerender, no deploy work. Findings F4-F9, F14 in FULL-AUDIT-REPORT.md.

## Summary of Changes

- apps/landing/index.html: canonical, full OG/Twitter set, Organization+WebSite JSON-LD, description tightened to 150 chars (source: landing-page.md §1 subhead)
- apps/landing/src/components/RouteHead.tsx: new per-route head component (title/description/canonical/OG swap + JSON-LD injection)
- apps/landing/src/pages/BreakpointPage.tsx: wires RouteHead (title, instance description, WebPage+Event JSON-LD; numbers per policy §2/§5)
- apps/landing/public/: robots.txt, sitemap.xml (2 URLs), llms.txt (platform summary + Blade Pool policy §§1-8), og.png 1200x630
- apps/landing/scripts/generate-og.mts: regenerable OG card (kit ring geometry, embedded woff2, chromium rasterize w/ rsvg fallback)

Verification: pnpm verify green (121 tests); browser-driven check on built dist — both routes render correct head (pool route swaps all tags + injects WebPage/Event JSON-LD). No deploy/prerender work per scope.
