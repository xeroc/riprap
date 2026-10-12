---
"@riprap/landing": patch
---

Claim wizard: a full-tier filing no longer ejects the flow mid-delivery. The shared send path invalidates every query on confirm, and the refetched membership (cap now fully reserved) flipped the live preflight to its cap-exhausted gate — the wizard jumped from the sign/publish steps back to the error state and evidence delivery died on the unmounted screen. The passing preflight is now frozen at sign start: steps 6–8 (sign, publish, filed) ride the frozen pass, so the entry gate never re-asserts after the transaction lands; a failed sign unfreezes it. The publish table also grows a per-row Retry button: a failed document row re-delivers on click (the manifest POST first if it never landed), and the step completes when every row reads delivered. A 409 conflict stays a hard stop — no retry past it.
