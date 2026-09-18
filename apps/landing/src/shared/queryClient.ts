/**
 * queryClient — the app-wide TanStack Query client singleton.
 *
 * Lives here (not in the entry main.tsx) so non-component modules — notably
 * `sendInstruction` — can invalidate queries after a transaction confirms.
 * Without that, post-tx screens render pre-tx cache: a joined member still
 * looks coverable, a stale tier slider stays interactive.
 */
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});
