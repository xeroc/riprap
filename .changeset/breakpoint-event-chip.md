---
"@riprap/landing": patch
---

Event chip on the mutuals cards: every card wears the Breakpoint 2026 lockup — the event site's own nav lockup (solana mark + BP26 wordmark, fetched to public/breakpoint-assets/, fills switched to currentColor) rendered black on the event pink at half the site's nav size, floating above the card's top edge. The pink is sampled from solana.com/breakpoint's computed styles (rgb(170,103,251), kept as --bp-2026-pink in the landing CSS with provenance — Breakpoint's brand color, not a riprap token). The chip is pointer-events-none so the card remains one clickable link, and the carousel track gains top padding so the overhang isn't clipped by the overflow container.
