---
"@riprap/landing": patch
---

Edge fade on the mutuals carousel: the rail's outer edges fade over color (not time) — cards dissolve into the band's ground as the drift carries them in from the right and out to the left, 12% of the track width per side via an alpha mask (.carousel-edge-fade in index.css, mask-image with -webkit- prefix). Desktop only (min-width: 64rem media query) — on a phone-width track the fade would swallow live cards. Hit-testing is unaffected: masked edge cards stay clickable.
