// #/app — the member wallet surface route, lazy-loaded by the router in
// src/main.tsx so the platform route's chunk never pulls in @solana/*. Reads
// only: wallet gate, member + claims (ConnectorKit, on-chain state). Never
// imported by the platform route.
import { SolanaProviders } from "../shared/providers.tsx";
import { AppPage } from "./AppPage.tsx";

export default function AppEntry() {
  return (
    <SolanaProviders>
      <AppPage />
    </SolanaProviders>
  );
}
