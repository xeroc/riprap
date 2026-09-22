// #/app/file-claim — the payout-request wizard route, lazy-loaded by the
// router in src/main.tsx so the platform route's chunk never pulls in
// @solana/*. Writes live here and only here (one hanse::file_claim tx — the
// sign step's bean). Never imported by the platform route.
import { SolanaProviders } from "../../shared/providers.tsx";
import { FileClaimPage } from "./FileClaimPage.tsx";

export default function FileClaimEntry() {
  return (
    <SolanaProviders>
      <FileClaimPage />
    </SolanaProviders>
  );
}
