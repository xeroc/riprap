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
import { MUTUALS } from "./mutuals/data";

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
  FileClaimPage: ({ pool }: { pool?: string }) => (
    <div data-testid="file-claim-route" data-pool={pool ?? "none"} />
  ),
}));
vi.mock("./adjudicate/AdjudicatePage", () => ({
  AdjudicatePage: ({
    session = null,
    pool,
  }: {
    session?: { round: number } | null;
    pool?: string;
  }) => (
    <div
      data-testid="adjudicate-route"
      data-session={session ? `round-${session.round}` : "board"}
      data-pool={pool ?? "none"}
    />
  ),
}));
vi.mock("./mutuals/MutualsPage", () => ({
  MutualsPage: () => <div data-testid="mutuals-route" />,
}));
const PLATFORM_H1 = "Self-governing money."; // payout-pool pass (copy doc §1)

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
});

describe("hash router", () => {
  it("renders the platform landing for the empty hash and for in-page anchors", () => {
    renderRouter();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(PLATFORM_H1);

    goHash("#mechanism"); // section anchor, not a route — platform stays mounted
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(PLATFORM_H1);
  });

  it("renders the pool route on #/2026-breakpoint-blade-pool (trailing slash tolerated)", async () => {
    window.location.hash = "#/2026-breakpoint-blade-pool/";
    renderRouter();
    expect(await screen.findByTestId("pool-route")).toBeTruthy();
    expect(screen.queryByTestId("app-route")).toBeNull();
  });

  it("renders the member route on #/app", async () => {
    window.location.hash = "#/app";
    renderRouter();
    expect(await screen.findByTestId("app-route")).toBeTruthy();
  });

  it("the bare #/app/file-claim hash is not a route — the platform landing answers", async () => {
    window.location.hash = "#/app/file-claim";
    renderRouter();
    expect((await screen.findByRole("heading", { level: 1 })).textContent).toBe(PLATFORM_H1);
  });

  it("renders the wizard on its pool-scoped route #/app/file-claim/:pool", async () => {
    window.location.hash = "#/app/file-claim/blade-pool";
    renderRouter();
    const route = await screen.findByTestId("file-claim-route");
    expect(route.getAttribute("data-pool")).toBe("blade-pool");
  });

  it("renders the adjudicate board on #/app/adjudicate and its pool-scoped route", async () => {
    window.location.hash = "#/app/adjudicate";
    renderRouter();
    const board = await screen.findByTestId("adjudicate-route");
    expect(board.getAttribute("data-session")).toBe("board");
    expect(board.getAttribute("data-pool")).toBe("none");
    goHash("#/app/adjudicate/blade-pool");
    await waitFor(() => {
      const scoped = screen.getByTestId("adjudicate-route");
      expect(scoped.getAttribute("data-session")).toBe("board");
      expect(scoped.getAttribute("data-pool")).toBe("blade-pool");
    });
  });

  it("renders the mutuals directory route on #/mutuals", async () => {
    window.location.hash = "#/mutuals";
    renderRouter();
    expect(await screen.findByTestId("mutuals-route")).toBeTruthy();
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
  });

  it("renders the Blade Pool page on its #/m pubkey route id too (legacy route kept)", async () => {
    // Blade pins per cluster (devnet + mainnet) — the route id is the pubkey now
    const blade = MUTUALS.find((m) => m.slug === "blade-pool");
    if (!blade?.pubkey) throw new Error("blade-pool listing has no pinned pubkey");
    window.location.hash = `#/m/${blade.pubkey}`;
    renderRouter();
    expect(await screen.findByTestId("pool-route")).toBeTruthy();
  });

  it("renders the adjudicate board on #/app/adjudicate", async () => {
    window.location.hash = "#/app/adjudicate";
    renderRouter();
    const route = await screen.findByTestId("adjudicate-route");
    expect(route.getAttribute("data-session")).toBe("board");
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

  it("swaps surfaces on hashchange without a reload", async () => {
    renderRouter();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(PLATFORM_H1);

    goHash("#/app");
    expect(await screen.findByTestId("app-route")).toBeTruthy();
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();

    goHash("#/");
    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(PLATFORM_H1),
    );
  });
});
