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
 *
 * Mobile (Android Chrome): the `mobile` prop registers the Mobile Wallet
 * Adapter — without it AppProvider never registers MWA (the config's
 * enableMobile flag is inert in @solana/connector 0.2.x), so mobile wallets
 * cannot connect. MWA needs a secure context — test against the deployed
 * site or `adb reverse tcp:5173 tcp:5173` + http://localhost:5173.
 */

import { Toaster } from "@riprap/ui";
import {
  AppProvider,
  createSolanaDevnet,
  createSolanaLocalnet,
  createSolanaMainnet,
  getDefaultConfig,
  getDefaultMobileConfig,
} from "@solana/connector";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { queryClient } from "./queryClient";

const DEVNET_RPC = import.meta.env.VITE_DEVNET_RPC ?? "https://api.devnet.solana.com";
const MAINNET_RPC = import.meta.env.VITE_MAINNET_RPC ?? "https://api.mainnet-beta.solana.com";

const APP_URL = "https://riprap.xyz";

const connectorConfig = getDefaultConfig({
  appName: "Riprap",
  appUrl: APP_URL,
  network: "mainnet",
  clusters: [
    createSolanaDevnet(DEVNET_RPC),
    createSolanaMainnet(MAINNET_RPC),
    createSolanaLocalnet("http://localhost:8899"),
  ],
});

/** MWA app identity — what Android wallets show on the authorization prompt. */
const mobileConfig = getDefaultMobileConfig({
  appName: "Riprap",
  appUrl: APP_URL,
  network: "mainnet",
});

export function SolanaProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider connectorConfig={connectorConfig} mobile={mobileConfig}>
        {children}
      </AppProvider>
      <Toaster />
    </QueryClientProvider>
  );
}
