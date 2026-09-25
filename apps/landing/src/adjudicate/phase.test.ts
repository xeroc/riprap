// seatPhase — the clock-derived phase matrix (riprap-jfb5). Law:
// ADJUDICATION-DASHBOARD §2 — phases derive from clock time vs the round's
// window ends, NEVER the lagging dispute state field; window spans are
// EVENT-MUTUAL §12 (review 48h · commit 12h · reveal 12h — read off the
// Round account). Copy: copy doc § /app/adjudicate duty board.

import { describe, expect, it } from "vitest";
import { phaseLabel, seatPhase } from "./phase";

// Fixed instants: draw at T0, windows review 48h / commit 12h / reveal 12h.
const T0 = 1_800_000_000n;
const REVIEW_END = T0 + 48n * 3600n;
const COMMIT_END = REVIEW_END + 12n * 3600n;
const REVEAL_END = COMMIT_END + 12n * 3600n;
const windows = { reviewEnd: REVIEW_END, commitEnd: COMMIT_END, revealEnd: REVEAL_END };

describe("seatPhase (spec §2: clock vs window ends, never the state field)", () => {
  it("before reviewEnd: review, closing at reviewEnd", () => {
    const phase = seatPhase(windows, T0 + 3600n);
    expect(phase).toEqual({ kind: "review", end: REVIEW_END });
    expect(phaseLabel(phase)).toBe("review");
  });

  it("at reviewEnd exactly: commit opens (windows close at their end)", () => {
    expect(seatPhase(windows, REVIEW_END)).toEqual({ kind: "commit", end: COMMIT_END });
  });

  it("between reviewEnd and commitEnd: commit", () => {
    const phase = seatPhase(windows, REVIEW_END + 1n);
    expect(phase).toEqual({ kind: "commit", end: COMMIT_END });
    expect(phaseLabel(phase)).toBe("commit");
  });

  it("between commitEnd and revealEnd: reveal", () => {
    const phase = seatPhase(windows, COMMIT_END + 1n);
    expect(phase).toEqual({ kind: "reveal", end: REVEAL_END });
    expect(phaseLabel(phase)).toBe("reveal");
  });

  it("at revealEnd and after: awaiting ruling, no clock", () => {
    const phase = seatPhase(windows, REVEAL_END);
    expect(phase).toEqual({ kind: "awaiting-ruling" });
    expect(phaseLabel(phase)).toBe("awaiting ruling");
  });
});
