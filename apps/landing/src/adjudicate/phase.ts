// seatPhase — the board's clock-derived phase (riprap-jfb5). Spec law
// (ADJUDICATION-DASHBOARD §2): phases derive from clock time vs the round's
// window ends + commit count — NEVER the lagging dispute state field (the
// accord Voting.tsx lesson). Pure; copy source: copy doc § /app/adjudicate
// (duty board phase clock: `review closes {{review_end}}` · … · `awaiting
// ruling`). Window spans: EVENT-MUTUAL §12 (review 48h · commit 12h · reveal
// 12h) — read off the Round account, never constants here.

/** The live phases a seat's round can be in; `end` is the closing unix-sec. */
export type SeatPhase =
  | { kind: "review"; end: bigint }
  | { kind: "commit"; end: bigint }
  | { kind: "reveal"; end: bigint }
  | { kind: "awaiting-ruling" };

/** The window ends the phase computation needs (Round field names). */
export interface PhaseWindows {
  reviewEnd: bigint;
  commitEnd: bigint;
  revealEnd: bigint;
}

/** Clock-first phase. The dispute state field is never consulted here — it
 * lags the chain; terminal labels come from DisputeState elsewhere. */
export function seatPhase(windows: PhaseWindows, nowSec: bigint): SeatPhase {
  if (nowSec < windows.reviewEnd) return { kind: "review", end: windows.reviewEnd };
  if (nowSec < windows.commitEnd) return { kind: "commit", end: windows.commitEnd };
  if (nowSec < windows.revealEnd) return { kind: "reveal", end: windows.revealEnd };
  return { kind: "awaiting-ruling" };
}

/** The card's mono phase word (copy doc: `review`/`commit`/`reveal` close at
 * the window end; `awaiting ruling` has no clock). */
export function phaseLabel(phase: SeatPhase): string {
  switch (phase.kind) {
    case "review":
      return "review";
    case "commit":
      return "commit";
    case "reveal":
      return "reveal";
    case "awaiting-ruling":
      return "awaiting ruling";
  }
}
