// §5.6 — the front page's supporter discs (copy doc §5.6): nothing renders
// until a real supporter exists (kit data law — no invented names); with data,
// every disc links the post it came from, mono initials when no avatar. The
// default list is the committed supporters.json (empty until the
// mention-watcher script — bean riprap-9spw — runs).

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { type Supporter, Supporters } from "./Supporters";

afterEach(cleanup);

const LISTED: Supporter[] = [
  {
    handle: "alice",
    url: "https://x.com/alice/status/1",
    avatar: "https://example.com/alice.png",
  },
  { handle: "bob", url: "https://x.com/bob/status/2" },
];

describe("Supporters — conditional band", () => {
  it("renders nothing while the list is empty (no invented supporters)", () => {
    const { container } = render(<Supporters list={[]} />);
    expect(container.textContent).toBe("");
  });

  it("one disc per post, linked to the post; initials disc without an avatar", () => {
    render(<Supporters list={LISTED} />);

    expect(
      screen.getByText(
        "Every post that mentions @riprapxyz lands a disc here, linked to the post.",
      ),
    ).toBeTruthy();

    const alice = screen.getByRole("link", { name: "@alice — their post" });
    expect(alice.getAttribute("href")).toBe("https://x.com/alice/status/1");
    expect(alice.getAttribute("target")).toBe("_blank");
    expect(alice.querySelector("img")?.getAttribute("alt")).toBe("@alice");

    const bob = screen.getByRole("link", { name: "@bob — their post" });
    expect(bob.textContent).toBe("BO"); // mono initials disc
    expect(bob.querySelector("img")).toBeNull();
  });
});
