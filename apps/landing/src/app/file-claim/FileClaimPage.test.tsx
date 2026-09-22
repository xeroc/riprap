// #/app/file-claim route shell (milestone riprap-q9dr, bean riprap-kic0): the
// emergency banner that leads every step, the wallet gate for deep-linked
// wallets, and the preflight loading line for connected ones — copy verbatim
// from meta/marketing/03-website-copy/landing-page.md § "/app/file-claim".
// The wizard interior lands with the wizard-flow beans.

import { AppProvider, getDefaultConfig } from "@solana/connector";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FileClaimPage } from "./FileClaimPage";

// --- hoisted mock state (vi.mock factories run before the module body) -------

const { walletState } = vi.hoisted(() => ({
  walletState: { isConnected: false, account: null as string | null },
}));

vi.mock("@solana/connector", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@solana/connector")>();
  return {
    ...actual,
    useWallet: () => walletState,
    useKitTransactionSigner: () => ({ signer: null }),
  };
});

const testConfig = getDefaultConfig({ appName: "riprap-test", network: "localnet" });

function renderWizard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AppProvider connectorConfig={testConfig}>
        <FileClaimPage />
      </AppProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  walletState.isConnected = false;
  walletState.account = null;
});
afterEach(cleanup);

describe("#/app/file-claim — route shell", () => {
  it("mounts with one main landmark, the shared nav, and the emergency banner leading", () => {
    const { container } = renderWizard();
    expect(container.querySelectorAll("main").length).toBe(1);
    // shared navbar (copy doc §0 + § /app nav): in-app controls, no Open App CTA
    expect(screen.queryByRole("link", { name: "Open App" })).toBeNull();
    expect(screen.getByRole("combobox")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Connect wallet" })).toBeTruthy();
    // the banner leads every step (copy doc § /app/file-claim): mono label,
    // care-and-police copy, mono emergency numbers, the proof-list link
    const banner = document.querySelector('[data-slot="emergency"]');
    expect(banner?.textContent).toContain("First");
    expect(banner?.textContent).toContain(
      "Get care and police first. In an emergency call 999 (UK) or 112 (EU). Report the assault as soon as you safely can — the police report is one of the five required proofs.",
    );
    expect(banner?.querySelectorAll("[data-num]").length).toBe(2); // 999 + 112, mono
    expect(
      screen.getByRole("link", { name: "the five required proofs" }).getAttribute("href"),
    ).toBe("#/2026-breakpoint-blade-pool");
  });

  it("without a wallet: the wizard gate copy; 'Connect a wallet' opens the picker", () => {
    renderWizard();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Payout request");
    expect(
      screen.getByText("Connect the wallet you joined with. Filing needs its signature."),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Connect a wallet" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("with a wallet connected: the preflight loading line, no gate", () => {
    walletState.isConnected = true;
    walletState.account = "W".repeat(32);
    renderWizard();
    expect(
      screen.getByText("Checking your membership, the claims window, and the juror fee."),
    ).toBeTruthy();
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    expect(screen.queryByRole("button", { name: "Connect a wallet" })).toBeNull();
  });
});
