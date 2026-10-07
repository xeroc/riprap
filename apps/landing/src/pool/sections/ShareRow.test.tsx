// ShareRow — the covered overlay's share field (copy doc § Covered overlay,
// 2026-09-24): the note verbatim, the prefilled message keyed to the member's
// tier (no invented numbers), one-click composer intents, copy-link toast.
// The message is pool-supplied (the hero config's buildText); these tests pin
// the Blade Pool's builder verbatim.

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { bladeShareText } from "./PoolHero";
import { ShareRow } from "./ShareRow";

const { toast } = vi.hoisted(() => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));
vi.mock("sonner", () => ({ toast }));

const BLADE_URL = "https://riprap.xyz/#/2026-breakpoint-blade-pool";

function renderRow(fee: string | null = "$20", cap: string | null = "$2,000") {
  return render(<ShareRow fee={fee} cap={cap} buildText={bladeShareText} url={BLADE_URL} />);
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("bladeShareText — the prefilled message (2026-09-24 rewrite)", () => {
  it("carries @riprapxyz and the figures; figures come from the props", () => {
    const text = bladeShareText("$20", "$2,000");
    expect(text).toContain("for $20 😳");
    expect(text).toContain("Worst case: up to $2,000 out.");
    expect(text).toContain("@riprapxyz");
  });

  it("unread tier drops the figures fragments — numbers are never faked", () => {
    const text = bladeShareText(null, null);
    expect(text).not.toContain("$");
    expect(text).not.toContain("null");
    expect(text).toContain("Get stabbed with friends.");
    expect(text).toContain("@riprapxyz");
  });
});

describe("ShareRow", () => {
  it("renders the SHARE label and the note verbatim (supporter twist)", () => {
    renderRow();
    expect(screen.getByText("Share")).toBeTruthy();
    expect(
      screen.getByText(
        "Post it with @riprapxyz — everyone who shares lands on the front page as a supporter, linked to their post.",
      ),
    ).toBeTruthy();
  });

  it("X / Farcaster / Telegram open composers with the message prefilled, new tab", () => {
    renderRow();
    const text = bladeShareText("$20", "$2,000");
    // X/Farcaster carry the message only (mention-first, 2026-09-24 rewrite —
    // doc reconciliation pending, bean riprap-k9jl); Telegram is link-first.
    const x = screen.getByRole("link", { name: "Share on X" });
    expect(x.getAttribute("href")).toBe(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
    );
    expect(x.getAttribute("target")).toBe("_blank");
    expect(x.getAttribute("rel")).toBe("noopener noreferrer");

    expect(screen.getByRole("link", { name: "Share on Farcaster" }).getAttribute("href")).toBe(
      `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`,
    );
    expect(screen.getByRole("link", { name: "Share on Telegram" }).getAttribute("href")).toBe(
      `https://t.me/share/url?url=${encodeURIComponent(BLADE_URL)}&text=${encodeURIComponent(text)}`,
    );
  });

  it("copy link writes the pool's URL and toasts", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    renderRow();

    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(BLADE_URL);
      expect(toast.success).toHaveBeenCalledWith("Link copied.");
    });
  });
});
