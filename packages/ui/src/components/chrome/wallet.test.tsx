import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AddressChip, shortenAddress } from "./AddressChip";
import { WalletDialog } from "./WalletDialog";

afterEach(cleanup);

// sample = devnet USDC mint, a reference deployment address (milestone riprap-9ehc)
const ADDRESS = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

describe("AddressChip — mono address stamp with copy affordance", () => {
  const writeText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    writeText.mockClear();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
  });

  it("shortens head…tail; short strings stay whole, base58 stays verbatim", () => {
    expect(shortenAddress(ADDRESS)).toBe("4zMM…ncDU");
    expect(shortenAddress("shortaddr")).toBe("shortaddr");
  });

  it("prints the shortened address in mono with data-num; title carries the full address", () => {
    render(<AddressChip address={ADDRESS} />);
    const chip = screen.getByRole("button", { name: /copy address/i });
    expect(chip.textContent).toContain("4zMM…ncDU");
    expect(chip.hasAttribute("data-num")).toBe(true);
    expect(chip.getAttribute("title")).toBe(ADDRESS);
    expect(chip.className).toContain("[font:var(--riprap-mono-label)]");
  });

  it("chrome law: radius 0, hairline edge, no shadow", () => {
    render(<AddressChip address={ADDRESS} />);
    const chip = screen.getByRole("button", { name: /copy address/i });
    expect(chip.className).toContain("rounded-none");
    expect(chip.className).toContain("border-hairline-strong");
    expect(chip.className).not.toMatch(/shadow-/);
  });

  it("copies the FULL address and confirms with a copied state", async () => {
    render(<AddressChip address={ADDRESS} />);
    fireEvent.click(screen.getByRole("button", { name: /copy address/i }));
    expect(writeText).toHaveBeenCalledWith(ADDRESS);
    expect(await screen.findByText("copied")).toBeTruthy();
  });
});

describe("WalletDialog — props-driven wallet picker", () => {
  it("disconnected: lists connectors verbatim; picking one calls onConnect(id)", () => {
    const onConnect = vi.fn();
    render(
      <WalletDialog
        open
        onOpenChange={() => {}}
        connectors={[
          { id: "phantom", name: "Phantom" },
          { id: "solflare", name: "Solflare" },
        ]}
        onConnect={onConnect}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Phantom" }));
    expect(onConnect).toHaveBeenCalledWith("phantom");
    expect(onConnect).not.toHaveBeenCalledWith("solflare");
  });

  it("zero connectors: the disabled state — nothing clickable", () => {
    render(<WalletDialog open onOpenChange={() => {}} connectors={[]} onConnect={() => {}} />);
    const none = screen.getByRole("button", { name: /no wallets available/i });
    expect(none.hasAttribute("disabled")).toBe(true);
  });

  it("connected: reuses AddressChip for the address and wires onDisconnect", () => {
    const onDisconnect = vi.fn();
    render(
      <WalletDialog
        open
        onOpenChange={() => {}}
        connected
        connectors={[{ id: "phantom", name: "Phantom" }]}
        onConnect={() => {}}
        address={ADDRESS}
        onDisconnect={onDisconnect}
      />,
    );
    expect(screen.getByText("4zMM…ncDU")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /disconnect/i }));
    expect(onDisconnect).toHaveBeenCalledTimes(1);
  });

  it("connected without an address renders the {{ADDRESS}} mono placeholder (kit data law)", () => {
    render(
      <WalletDialog
        open
        onOpenChange={() => {}}
        connected
        connectors={[]}
        onConnect={() => {}}
        onDisconnect={() => {}}
      />,
    );
    const placeholder = screen.getByText("{{ADDRESS}}");
    expect(placeholder.className).toContain("[font:var(--riprap-mono-label)]");
    expect(placeholder.hasAttribute("data-num")).toBe(true);
  });
});
