// /2026-breakpoint-blade-pool — entry mount. The page head (title/OG/canonical/
// Event JSON-LD) is static in this entry's index.html; this module renders the
// page only. Solana imports become legal here (never in the platform entry).
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../index.css";
import { SolanaProviders } from "../shared/providers.tsx";
import { BreakpointPage } from "./BreakpointPage.tsx";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <SolanaProviders>
        <BreakpointPage />
      </SolanaProviders>
    </StrictMode>,
  );
}
