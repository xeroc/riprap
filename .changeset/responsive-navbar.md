---
"@riprap/ui": minor
"@riprap/landing": minor
---

Make the navbar responsive: below 768px the actions slot (cluster select, wallet controls) and the CTA now collapse into the burger drawer instead of overflowing the mobile bar. The drawer carries the same content as the desktop right side — links first, then a hairline-ruled section with the cluster select, the wallet controls (buttons full-width), and the Open App CTA, which stays dropped inside /app as on desktop. Drawer links and the CTA close the menu on navigate; AppNavControls drops its per-item sm gating since TopNav now owns the breakpoint.
