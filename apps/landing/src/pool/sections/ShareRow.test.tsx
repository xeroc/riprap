// ShareRow — the covered overlay's share field (copy doc § Covered overlay,
// 2026-09-24): the note verbatim, the prefilled message keyed to the member's
// tier (no invented numbers), one-click composer intents, copy-link toast.

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ShareRow, shareText } from "./ShareRow";

const { toast } = vi.hoisted(() => ({ toast: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("shareText — the prefilled message", () => {
  it("carries @riprapxyz and the pool line; figures come from the props", () => {
    const text = shareText("$20", "$2,000");
    expect(text).toContain("$20 in, up to $2,000 out — ");
    expect(text).toContain("Blade Pool at Breakpoint 2026");
    expect(text).toContain("@riprapxyz");
  });

  it("unread tier drops the figures clause — numbers are never faked", () => {
    const text = shareText(null, null);
    expect(text).not.toContain("$");
    expect(text).toContain("Blade Pool at Breakpoint 2026, claims juried by members.");
  });
});

describe("ShareRow", () => {
  it("renders the SHARE label and the note verbatim (supporter twist)", () => {
    render(<ShareRow fee="$20" cap="$2,000" />);
    expect(screen.getByText("Share")).toBeTruthy();
    expect(
      screen.getByText(
        "Post it with @riprapxyz — everyone who shares lands on the front page as a supporter, linked to their post.",
      ),
    ).toBeTruthy();
  });

  it("X / Farcaster / Telegram open composers with the message prefilled, new tab", () => {
    render(<ShareRow fee="$20" cap="$2,000" />);
    const text = shareText("$20", "$2,000");
    const full = `${text} https://riprap.xyz/2026-breakpoint-blade-pool`;

    const x = screen.getByRole("link", { name: "Share on X" });
    expect(x.getAttribute("href")).toBe(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(full)}`,
    );
    expect(x.getAttribute("target")).toBe("_blank");
    expect(x.getAttribute("rel")).toBe("noopener noreferrer");

    expect(screen.getByRole("link", { name: "Share on Farcaster" }).getAttribute("href")).toBe(
      `https://warpcast.com/~/compose?text=${encodeURIComponent(full)}`,
    );
    expect(screen.getByRole("link", { name: "Share on Telegram" }).getAttribute("href")).toBe(
      `https://t.me/share/url?url=${encodeURIComponent("https://riprap.xyz/2026-breakpoint-blade-pool")}&text=${encodeURIComponent(text)}`,
    );
  });

  it("copy link writes the pool URL and toasts", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<ShareRow fee="$20" cap="$2,000" />);

    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("https://riprap.xyz/2026-breakpoint-blade-pool");
      expect(toast).toHaveBeenCalledWith("Link copied.");
    });
  });
});
