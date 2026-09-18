// /app — the member wallet surface entry. Shell only in this change: the
// wallet gate + member reads (ConnectorKit, getJoinContext) mount here in the
// on-chain join milestone. Never imported by the platform or pool entries.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../index.css";
import { SolanaProviders } from "../shared/providers.tsx";
import { AppPage } from "./AppPage.tsx";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <SolanaProviders>
        <AppPage />
      </SolanaProviders>
    </StrictMode>,
  );
}
