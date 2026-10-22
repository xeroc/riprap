---
"@riprap/landing": patch
---

Fix unhandled `window is not defined` in tests: the 2s copy-flash timer now clears on unmount (shared `useCopyFlash` in the blurb page, `useCopyText` in the policy terms), so no `setState` fires after the component or test environment is gone.
