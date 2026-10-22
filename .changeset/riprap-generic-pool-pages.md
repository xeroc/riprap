---
"@riprap/landing": minor
---

Community pool pages: unknown `#/m/<pubkey>` route ids now render a generic
def-driven pool page instead of the platform landing. The page resolves the
on-chain mutual, pulls its anchored riprap-def/v1 doc off the evidence
daemon's domain CAS, and renders PoolPageShell + a generic hero from the doc
(marketing block with kind-templated defaults, join flow on the shared
usePoolJoin machine, tier picker for multi-tier defs). The shared shell's
#policy band takes an address override so community pools' raw terms bind to
their derived domain_ref. New def seam: schema (frontmatter parse), sections
(§-parser), listing (derived MutualListing). Missing/invalid defs render
honest terminal states — never fallback content. First-party pages untouched.
