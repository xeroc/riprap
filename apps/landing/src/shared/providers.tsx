/**
 * providers.tsx — the Solana-entry provider stack.
 *
 * ConnectorKit AppProvider (wallet + cluster) + TanStack Query + the kit
 * toast surface. Mounted by the pool and `/app` entries ONLY — the platform
 * entry (`src/main.tsx`) must stay Solana-free, so this file is never
 * imported from the platform graph.
 *
 * Clusters: devnet (default) + mainnet-beta + localnet; RPC URLs come from
 * VITE_DEVNET_RPC / VITE_MAINNET_RPC with public defaults.
 */

import { Toaster } from "@riprap/ui";
import {
  AppProvider,
  createSolanaDevnet,
  createSolanaLocalnet,
  createSolanaMainnet,
  getDefaultConfig,
} from "@solana/connector";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { queryClient } from "./queryClient";

const DEVNET_RPC = import.meta.env.VITE_DEVNET_RPC ?? "https://api.devnet.solana.com";
const MAINNET_RPC = import.meta.env.VITE_MAINNET_RPC ?? "https://api.mainnet-beta.solana.com";

const connectorConfig = getDefaultConfig({
  appName: "Riprap",
  network: "devnet",
  clusters: [
    createSolanaDevnet(DEVNET_RPC),
    createSolanaMainnet(MAINNET_RPC),
    createSolanaLocalnet("http://localhost:8899"),
  ],
});

export function SolanaProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider connectorConfig={connectorConfig}>{children}</AppProvider>
      <Toaster />
    </QueryClientProvider>
  );
}
