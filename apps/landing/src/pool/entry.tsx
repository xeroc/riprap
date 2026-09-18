// #/2026-breakpoint-blade-pool — the pool route, lazy-loaded by the router in
// src/main.tsx so the platform route's chunk never pulls in @solana/*.
// <title> swaps in the router; the platform head in index.html serves every
// route. Solana imports are legal here (never in the platform route).
import { SolanaProviders } from "../shared/providers.tsx";
import { BreakpointPage } from "./BreakpointPage.tsx";

export default function PoolEntry() {
  return (
    <SolanaProviders>
      <BreakpointPage />
    </SolanaProviders>
  );
}
