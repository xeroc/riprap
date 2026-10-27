---
"@riprap/landing": patch
---

Community-pool defs resolved off the evidence-server CAS now sanitize `marketing.logo` at parse time: a value that isn't an absolute http(s) URL drops the field (never the doc), so the generic hero's `<img>` can never carry an attacker-chosen scheme in user-defined pool content. The hero logo also sends `referrerPolicy="no-referrer"`, matching the policy body's image handling.
