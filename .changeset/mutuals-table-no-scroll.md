---
"@riprap/landing": patch
---

The /mutuals table never scrolls: the overflow-x wrapper and the 44rem minimum width are gone — the table is w-full and fits the page at every width. On phones the Covers (tagline) column hides below sm so the remaining columns fit without squeezing (the taglines live on the cards and each pool's detail page), the strip cells contain the rotated lockup's unrotated layout box (overflow-hidden — the rotated paint fits the strip, the invisible pre-rotation box no longer bleeds into the page width), and pool names wrap instead of forcing nowrap. No hover scrollbar anywhere on the route.
