// #/app/file-claim — the payout-request wizard route, lazy-loaded by the
// router in src/main.tsx so the platform route's chunk never pulls in
// @solana/*. Never imported by the platform route.
import { SolanaProviders } from "../../shared/providers.tsx";
import { FileClaimPage } from "./FileClaimPage.tsx";

export default function FileClaimEntry() {
  return (
    <SolanaProviders>
      <FileClaimPage />
    </SolanaProviders>
  );
}
