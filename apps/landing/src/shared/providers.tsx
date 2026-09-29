/**
 * providers.tsx — the app-root Solana provider stack.
 *
 * ConnectorKit AppProvider (wallet + cluster) + TanStack Query + the kit
 * toast surface. Mounted ONCE in src/main.tsx above the router, so a wallet
 * connected on any route stays connected on every route (ADR-0007 — one
 * connect per page session, pool → app → adjudicate → file-claim).
 *
 * Clusters: mainnet-beta (default, 2026-09-29) + devnet + localnet; RPC URLs
 * come from VITE_MAINNET_RPC / VITE_DEVNET_RPC with public defaults.
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
  network: "mainnet",
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
