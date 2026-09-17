---
# riprap-6dv3
title: Three Vite entries + static pool head + delete branching/RouteHead
status: todo
type: task
created_at: 2026-09-17T14:05:48Z
updated_at: 2026-09-17T14:05:48Z
parent: riprap-p7dl
---

vite.config: rollupOptions.input {main, 2026-breakpoint-blade-pool/index.html, app/index.html}, appType mpa. Move BreakpointPage into src/pool entry with static head (title/OG/canonical/Event JSON-LD verbatim from current BREAKPOINT_HEAD); delete App.tsx pathname branch + RouteHead; root entry keeps platform sections only. Mount smoke test per entry; BreakpointPage tests move with it.
