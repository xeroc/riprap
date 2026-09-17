import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ClusterSelect } from "./ClusterSelect";

afterEach(cleanup);

// Radix Select jsdom gaps: no ResizeObserver, no pointer capture, no scroll
beforeAll(() => {
  class ResizeObserverStub implements ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  window.ResizeObserver = ResizeObserverStub;
  window.HTMLElement.prototype.scrollIntoView = () => {};
  window.Element.prototype.hasPointerCapture = () => false as unknown as boolean;
  window.Element.prototype.releasePointerCapture = () => {};
});

// the milestone cluster set (riprap-9ehc)
const CLUSTERS = [
  { value: "devnet", label: "devnet" },
  { value: "localnet", label: "localnet" },
  { value: "mainnet-beta", label: "mainnet-beta" },
];

function open() {
  fireEvent.click(screen.getByRole("combobox", { name: /cluster/i }));
}

describe("ClusterSelect — props-driven cluster picker", () => {
  it("prints the selected label from props; every label comes from props, none invented", async () => {
    render(<ClusterSelect clusters={CLUSTERS} value="devnet" onValueChange={() => {}} />);
    expect(screen.getByRole("combobox", { name: /cluster/i }).textContent).toBe("devnet");
    open();
    await waitFor(() => screen.getByRole("listbox"));
    for (const cluster of CLUSTERS) {
      expect(screen.getByRole("option", { name: cluster.label })).toBeTruthy();
    }
    expect(screen.queryByRole("option", { name: "testnet" })).toBeNull(); // never invented
  });

  it("shows the mono `cluster` prompt when nothing is selected", () => {
    render(<ClusterSelect clusters={CLUSTERS} onValueChange={() => {}} />);
    expect(screen.getByRole("combobox", { name: /cluster/i }).textContent).toBe("cluster");
  });

  it("picking an option reports its value through onValueChange", async () => {
    const onValueChange = vi.fn();
    render(<ClusterSelect clusters={CLUSTERS} value="devnet" onValueChange={onValueChange} />);
    open();
    fireEvent.click(await screen.findByRole("option", { name: "mainnet-beta" }));
    expect(onValueChange).toHaveBeenCalledWith("mainnet-beta");
  });

  it("trigger law: mono-label stamp, uppercase CSS-case, radius 0, hairline, 44px tap zone", () => {
    render(<ClusterSelect clusters={CLUSTERS} value="devnet" onValueChange={() => {}} />);
    const trigger = screen.getByRole("combobox", { name: /cluster/i });
    expect(trigger.className).toContain("[font:var(--riprap-mono-label)]");
    expect(trigger.className).toContain("uppercase");
    expect(trigger.className).toContain("rounded-none");
    expect(trigger.className).toContain("border-hairline-strong");
    expect(trigger.className).toContain("data-[size=default]:h-11");
    expect(trigger.className).not.toMatch(/shadow-|rounded-(md|lg)/);
  });

  it("renders disabled without opening", () => {
    render(<ClusterSelect clusters={CLUSTERS} value="devnet" onValueChange={() => {}} disabled />);
    const trigger = screen.getByRole("combobox", { name: /cluster/i }) as HTMLButtonElement;
    expect(trigger.disabled).toBe(true);
    fireEvent.click(trigger);
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
