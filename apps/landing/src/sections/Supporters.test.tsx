// §5.6 — the front page's supporter discs (copy doc §5.6): nothing renders
// until a real supporter exists (kit data law — no invented names); with data,
// every disc links the post it came from, mono initials when no avatar. The
// default list is the committed supporters.json (empty until the
// mention-watcher script — bean riprap-9spw — runs).

import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { type Supporter, SupporterDiscs, Supporters } from "./Supporters";

const LISTED: Supporter[] = [
  {
    handle: "alice",
    url: "https://x.com/alice/status/1",
    avatar: "https://example.com/alice.png",
  },
  { handle: "bob", url: "https://x.com/bob/status/2" },
];

afterEach(cleanup);

describe("Supporters — conditional band", () => {
  it("renders nothing while the list is empty (no invented supporters)", () => {
    const { container } = render(<Supporters list={[]} />);
    expect(container.textContent).toBe("");
  });

  it("one disc per post, linked to the post; initials disc without an avatar", () => {
    render(<Supporters list={LISTED} />);

    expect(
      screen.getByText("Everyone who mentions @riprapxyz lands a disc here, linked to their post."),
    ).toBeTruthy();

    const alice = screen.getByRole("link", { name: "@alice — their post" });
    expect(alice.getAttribute("href")).toBe("https://x.com/alice/status/1");
    expect(alice.getAttribute("target")).toBe("_blank");
    expect(alice.querySelector("img")?.getAttribute("alt")).toBe("@alice");

    const bob = screen.getByRole("link", { name: "@bob — their post" });
    expect(bob.textContent).toBe("BO"); // mono initials disc
    expect(bob.querySelector("img")).toBeNull();
  });

  it("above 16 people: the row caps at 16 and rotates a hidden disc in", async () => {
    vi.useFakeTimers();
    try {
      const twenty = Array.from({ length: 20 }, (_, i) => ({
        handle: `h${i}`,
        url: `https://x.com/h${i}/status/${i}`,
      }));
      const { container } = render(<SupporterDiscs list={twenty} />);
      const links = () => [...container.querySelectorAll("a[href]")];
      expect(links().length).toBe(16);
      const before = links().map((a) => a.getAttribute("href"));

      // one full swap cycle: interval → fade-out → slot replacement → fade-in
      // (act-flushed — the re-renders land inside the fake-time window)
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      expect(links().length).toBe(16); // still a 16-disc row
      const after = links().map((a) => a.getAttribute("href"));
      expect(new Set(after).size).toBe(16); // still unique people
      expect(after).not.toEqual(before); // a hidden disc rotated in
      const entered = after.find((href) => !before.includes(href));
      expect(twenty.some((s) => s.url === entered)).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("16 or fewer people: every disc renders, nothing rotates", () => {
    vi.useFakeTimers();
    try {
      const sixteen = Array.from({ length: 16 }, (_, i) => ({
        handle: `h${i}`,
        url: `https://x.com/h${i}/status/${i}`,
      }));
      const { container } = render(<SupporterDiscs list={sixteen} />);
      expect(container.querySelectorAll("a[href]").length).toBe(16);
      vi.advanceTimersByTime(20000);
      expect(container.querySelectorAll("a[href]").length).toBe(16);
    } finally {
      vi.useRealTimers();
    }
  });
});
