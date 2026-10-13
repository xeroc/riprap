// The one navbar (copy doc §0): identical brand/links on every surface; the
// right side carries the cluster select + wallet controls on EVERY surface
// (2026-09-29), plus the Open App CTA except inside /app (`inApp`). Below md
// the whole right side collapses into the burger drawer (kit TopNav) — the
// drawer carries the same content as the desktop bar.

import type * as Connector from "@solana/connector";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SiteNav } from "./SiteNav";

// The navbar owns the wallet controls — stub the connector hooks they read;
// structure tests don't need the real AppProvider stack.
vi.mock("@solana/connector", async (importOriginal) => {
  const actual = await importOriginal<typeof Connector>();
  return {
    ...actual,
    useWallet: () => ({ isConnected: false, account: null }),
    useCluster: () => ({
      clusters: [{ id: "mainnet", label: "mainnet-beta" }],
      cluster: { id: "mainnet", label: "mainnet-beta" },
      setCluster: vi.fn(),
    }),
    useWalletConnectors: () => [],
    useConnectWallet: () => ({ connect: vi.fn() }),
    useDisconnectWallet: () => ({ disconnect: vi.fn() }),
  };
});

afterEach(cleanup);

describe("SiteNav", () => {
  it("renders the §0 links: How it works → the platform mechanism anchor, X (glyph) → the handle", () => {
    render(<SiteNav />);
    expect(screen.getByRole("link", { name: "How it works" }).getAttribute("href")).toBe(
      "#mechanism",
    );
    expect(screen.getByRole("link", { name: "X" }).getAttribute("href")).toBe(
      "https://x.com/riprapxyz",
    );
  });

  it("right side on every surface: cluster select + Connect wallet, plus the Open App CTA → #/app", () => {
    render(<SiteNav />);
    expect(screen.getByRole("combobox", { name: "cluster" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Connect wallet" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Open App" }).getAttribute("href")).toBe("#/app");
  });

  it("mobile: the burger menu carries the links, wallet controls, and the Open App CTA", () => {
    render(<SiteNav />);
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const menu = screen.getByRole("dialog");
    expect(within(menu).getByRole("link", { name: "How it works" })).toBeTruthy();
    expect(within(menu).getByRole("combobox", { name: "cluster" })).toBeTruthy();
    expect(within(menu).getByRole("button", { name: "Connect wallet" })).toBeTruthy();
    expect(within(menu).getByRole("link", { name: "Open App" }).getAttribute("href")).toBe("#/app");
  });

  it("mobile inApp: the burger menu carries the wallet controls, no Open App CTA", () => {
    render(<SiteNav inApp />);
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const menu = screen.getByRole("dialog");
    expect(within(menu).getByRole("combobox", { name: "cluster" })).toBeTruthy();
    expect(within(menu).getByRole("button", { name: "Connect wallet" })).toBeTruthy();
    expect(within(menu).queryByRole("link", { name: "Open App" })).toBeNull();
  });

  it("inApp: same wallet controls, no Open App CTA", () => {
    render(<SiteNav inApp />);
    expect(screen.getByRole("combobox", { name: "cluster" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Connect wallet" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Open App" })).toBeNull();
  });
});
