// supporters.mts — the pure half of the mention watcher (bean riprap-9spw):
// tweet → disc normalization and the merge law (dedupe by post URL, fresh
// wins, capped at the row limit). The network half is exercised by the first
// audited run, not here.

import { describe, expect, it } from "vitest";
import { mergeSupporters, type Supporter, toSupporter } from "./supporters.mts";

describe("toSupporter", () => {
  it("maps a tweet to handle + post URL, avatar only when present", () => {
    expect(
      toSupporter({
        id: "123",
        author: { userName: "alice", profilePicture: "https://pbs.example/a.jpg" },
      }),
    ).toEqual({
      handle: "alice",
      url: "https://x.com/alice/status/123",
      avatar: "https://pbs.example/a.jpg",
    });
    expect(toSupporter({ id: "456", author: { userName: "@bob" } })).toEqual({
      handle: "bob",
      url: "https://x.com/bob/status/456",
    });
  });

  it("rejects tweets without an id or author — never an invented disc", () => {
    expect(toSupporter({ author: { userName: "alice" } })).toBeNull();
    expect(toSupporter({ id: "789" })).toBeNull();
  });
});

describe("mergeSupporters", () => {
  const a: Supporter = { handle: "alice", url: "https://x.com/alice/status/1" };
  const b: Supporter = { handle: "bob", url: "https://x.com/bob/status/2" };

  it("one disc per person: a handle posting twice keeps only its newest post", () => {
    const aliceAgain = { handle: "alice", url: "https://x.com/alice/status/9" };
    // found leads in API Latest order — alice's first (newest) post wins
    expect(mergeSupporters([a, b], [aliceAgain, a])).toEqual([aliceAgain, b]);
  });

  it("a re-found person's disc refreshes to their newest post; others keep theirs", () => {
    const freshA = {
      ...a,
      url: "https://x.com/alice/status/7",
      avatar: "https://pbs.example/new.jpg",
    };
    expect(mergeSupporters([a, b], [freshA])).toEqual([freshA, b]);
  });

  it("caps the row at the limit, unique people, newest first", () => {
    const many = Array.from({ length: 30 }, (_, i) => ({
      handle: `h${i}`,
      url: `https://x.com/h${i}/status/${i}`,
    }));
    expect(mergeSupporters([], many, 24)).toHaveLength(24);
    expect(mergeSupporters([], many, 24)[0]?.url).toBe("https://x.com/h0/status/0");
  });
});
