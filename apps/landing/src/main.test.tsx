// The hash router (src/main.tsx): platform landing as the default route, the
// lazy pool/app/wizard route pages on their hashes, per-route <title> swap,
// and hashchange re-render without a reload. Route pages are stubbed —
// their real graphs are covered by the BreakpointPage, AppPage, and
// FileClaimPage suites.
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Router } from "./main";

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
vi.mock("./blurb/BlurbPage", () => ({
  BlurbPage: () => <div data-testid="blurb-route" />,
}));
const PLATFORM_H1 = "Finance went P2P. Risk Cover can too.";

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
    render(<Router />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(PLATFORM_H1);

    goHash("#mechanism"); // section anchor, not a route — platform stays mounted
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(PLATFORM_H1);
  });

  it("renders the pool route on #/2026-breakpoint-blade-pool (trailing slash tolerated) and swaps the title", async () => {
    window.location.hash = "#/2026-breakpoint-blade-pool/";
    render(<Router />);
    expect(await screen.findByTestId("pool-route")).toBeTruthy();
    expect(screen.queryByTestId("app-route")).toBeNull();
    await waitFor(() => expect(document.title).toBe("Riprap: Blade Pool @ Breakpoint 2026"));
  });

  it("renders the member route on #/app and titles it", async () => {
    window.location.hash = "#/app";
    render(<Router />);
    expect(await screen.findByTestId("app-route")).toBeTruthy();
    await waitFor(() => expect(document.title).toBe("Riprap: Blade Pool member app"));
  });

  it("renders the wizard route on #/app/file-claim (trailing slash tolerated) and titles it", async () => {
    window.location.hash = "#/app/file-claim/";
    render(<Router />);
    expect(await screen.findByTestId("file-claim-route")).toBeTruthy();
    expect(screen.queryByTestId("app-route")).toBeNull();
    await waitFor(() => expect(document.title).toBe("Riprap: File a payout request"));
  });

  it("renders the blurb route on #/blurb and titles it", async () => {
    window.location.hash = "#/blurb";
    render(<Router />);
    expect(await screen.findByTestId("blurb-route")).toBeTruthy();
    await waitFor(() => expect(document.title).toBe("Riprap: blurb & brand kit"));
  });

  it("renders the adjudicate board on #/app/adjudicate and titles it", async () => {
    window.location.hash = "#/app/adjudicate";
    render(<Router />);
    const route = await screen.findByTestId("adjudicate-route");
    expect(route.getAttribute("data-session")).toBe("board");
    await waitFor(() => expect(document.title).toBe("Riprap: Adjudicate"));
  });

  it("renders the session route on #/app/adjudicate/:dispute/:round (trailing slash tolerated)", async () => {
    const dispute = "D".repeat(32);
    window.location.hash = `#/app/adjudicate/${dispute}/1/`;
    render(<Router />);
    const route = await screen.findByTestId("adjudicate-route");
    expect(route.getAttribute("data-session")).toBe("round-1");
    expect(screen.queryByTestId("app-route")).toBeNull();
  });

  it("falls back to the board for malformed session segments", async () => {
    window.location.hash = "#/app/adjudicate/not-a-round";
    render(<Router />);
    const route = await screen.findByTestId("adjudicate-route");
    expect(route.getAttribute("data-session")).toBe("board");
  });

  it("swaps surfaces on hashchange without a reload, restoring the platform title", async () => {
    render(<Router />);
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
