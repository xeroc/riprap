// #/app/adjudicate — the juror duty board route, lazy-loaded by the router
// in src/main.tsx so the platform route's chunk never pulls in @solana/*.
// Reads-only v1 (seat discovery + phase clocks); the wizard's writes land in
// their own beans inside this same chunk. Never imported by the platform
// route.
import { SolanaProviders } from "../shared/providers.tsx";
import { AdjudicatePage, type SessionRoute } from "./AdjudicatePage.tsx";

export default function AdjudicateEntry({ session = null }: { session?: SessionRoute | null }) {
  return (
    <SolanaProviders>
      <AdjudicatePage session={session} />
    </SolanaProviders>
  );
}
