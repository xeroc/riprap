---
# riprap-n8cx
title: Juror delivery client + decryption seam + leaf gates
status: todo
type: task
assigned: implementer
created_at: 2026-09-25T08:53:10Z
updated_at: 2026-09-25T08:53:10Z
parent: riprap-wxs8
---

Per-file GET .../for/{juror}/{round}/{path}; decrypt only through a decryptDelivery seam (browser delivery key — founder interface, EXTERNAL, pending; step 0 gates on key presence with honest no-delivery-key state); leaf gate sha256(bytes) == entry.sha256 with URL/sentinel skip; per-doc states verified/pending/failed. Spec §5, §9.
