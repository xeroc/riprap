// The hash router (src/main.tsx): platform landing as the default route, the
// lazy pool/app/wizard route pages on their hashes, per-route <title> swap,
// and hashchange re-render without a reload. Route pages are stubbed —
// their real graphs are covered by the BreakpointPage, AppPage, and
// FileClaimPage suites.

import type * as Connector from "@solana/connector";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Router } from "./main";

// The platform route's navbar carries the wallet controls (§0, 2026-09-29) —
// stub the connector hooks; route-matching tests don't need the real stack.
vi.mock("@solana/connector", async (importOriginal) => {
  const actual = await importOriginal<typeof Connector>();
  return {
    ...actual,
    useWallet: () => ({ isConnected: false, account: null }),
    useCluster: () => ({ clusters: [], cluster: null, setCluster: vi.fn() }),
    useWalletConnectors: () => [],
    useConnectWallet: () => ({ connect: vi.fn() }),
    useDisconnectWallet: () => ({ disconnect: vi.fn() }),
  };
});
vi.mock("./pool/BreakpointPage", () => ({
  BreakpointPage: () => <div data-testid="pool-route" />,
}));
vi.mock("./app/AppPage", () => ({
  AppPage: () => <div data-testid="app-route" />,
}));
vi.mock("./app/file-claim/FileClaimPage", () => ({
  FileClaimPage: () => <div data-testid="file-claim-route" />,
}));
vi.mock("./adjudicate/AdjudicatePage", () => ({
  AdjudicatePage: ({ session = null }: { session?: { round: number } | null }) => (
    <div
      data-testid="adjudicate-route"
      data-session={session ? `round-${session.round}` : "board"}
    />
  ),
}));
vi.mock("./mutuals/MutualsPage", () => ({
  MutualsPage: () => <div data-testid="mutuals-route" />,
}));
const PLATFORM_H1 = "DeFi rebuilt finance. Insurance is next."; // OnRe experiment v2 (copy doc §1)

// The platform route's mutuals band reads live member counts (useQuery) —
// give the bare Router test renders a throwaway client.
function renderRouter() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>,
  );
}

function goHash(hash: string) {
  window.location.hash = hash;
  // jsdom may queue its own hashchange; dispatching is deterministic either way.
  window.dispatchEvent(new Event("hashchange"));
}

afterEach(() => {
  cleanup();
  window.location.hash = "";
  document.title = "";
});

describe("hash router", () => {
  it("renders the platform landing for the empty hash and for in-page anchors", () => {
    renderRouter();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(PLATFORM_H1);

    goHash("#mechanism"); // section anchor, not a route — platform stays mounted
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(PLATFORM_H1);
  });

  it("renders the pool route on #/2026-breakpoint-blade-pool (trailing slash tolerated) and swaps the title", async () => {
    window.location.hash = "#/2026-breakpoint-blade-pool/";
    renderRouter();
    expect(await screen.findByTestId("pool-route")).toBeTruthy();
    expect(screen.queryByTestId("app-route")).toBeNull();
    await waitFor(() => expect(document.title).toBe("Riprap: Blade Pool @ Breakpoint 2026"));
  });

  it("renders the member route on #/app and titles it", async () => {
    window.location.hash = "#/app";
    renderRouter();
    expect(await screen.findByTestId("app-route")).toBeTruthy();
    await waitFor(() => expect(document.title).toBe("Riprap: Blade Pool member app"));
  });

  it("renders the wizard route on #/app/file-claim (trailing slash tolerated) and titles it", async () => {
    window.location.hash = "#/app/file-claim/";
    renderRouter();
    expect(await screen.findByTestId("file-claim-route")).toBeTruthy();
    expect(screen.queryByTestId("app-route")).toBeNull();
    await waitFor(() => expect(document.title).toBe("Riprap: File a payout request"));
  });

  it("renders the mutuals directory route on #/mutuals and titles it", async () => {
    window.location.hash = "#/mutuals";
    renderRouter();
    expect(await screen.findByTestId("mutuals-route")).toBeTruthy();
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    await waitFor(() => expect(document.title).toBe("Riprap: Mutuals"));
  });

  it("renders the Blade Pool page on its new #/m route id too (legacy route kept)", async () => {
    window.location.hash = "#/m/blade-pool";
    renderRouter();
    expect(await screen.findByTestId("pool-route")).toBeTruthy();
    await waitFor(() => expect(document.title).toBe("Riprap: Blade Pool"));
  });

  it("renders the adjudicate board on #/app/adjudicate and titles it", async () => {
    window.location.hash = "#/app/adjudicate";
    renderRouter();
    const route = await screen.findByTestId("adjudicate-route");
    expect(route.getAttribute("data-session")).toBe("board");
    await waitFor(() => expect(document.title).toBe("Riprap: Adjudicate"));
  });

  it("renders the session route on #/app/adjudicate/:dispute/:round (trailing slash tolerated)", async () => {
    const dispute = "D".repeat(32);
    window.location.hash = `#/app/adjudicate/${dispute}/1/`;
    renderRouter();
    const route = await screen.findByTestId("adjudicate-route");
    expect(route.getAttribute("data-session")).toBe("round-1");
    expect(screen.queryByTestId("app-route")).toBeNull();
  });

  it("falls back to the board for malformed session segments", async () => {
    window.location.hash = "#/app/adjudicate/not-a-round";
    renderRouter();
    const route = await screen.findByTestId("adjudicate-route");
    expect(route.getAttribute("data-session")).toBe("board");
  });

  it("swaps surfaces on hashchange without a reload, restoring the platform title", async () => {
    renderRouter();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(PLATFORM_H1);

    goHash("#/app");
    expect(await screen.findByTestId("app-route")).toBeTruthy();
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();

    goHash("#/");
    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(PLATFORM_H1),
    );
    await waitFor(() => expect(document.title).toBe("")); // the platform title captured at mount
  });
});
