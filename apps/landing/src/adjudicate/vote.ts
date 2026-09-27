// vote.ts — the commit→reveal bridge and the reveal code
// (ADJUDICATION-DASHBOARD §4 steps 4–5, §8 persistence). The salt bridge
// persists the reveal preimage in localStorage keyed (dispute, round,
// juror) — the accord Voting.tsx convention — so a same-browser reveal is
// one click across the 12h commit→reveal gap (EVENT-MUTUAL §12). The
// downloadable reveal code (salt + choice, mono) is the only cross-browser
// path: the 32-byte salt is generated locally (crypto.getRandomValues) and
// leaves the browser only inside it. The salt and choice never persist
// anywhere but these two artifacts; both clear with the outcome (§8).
//
// Pure module: no React, no chain reads. The reveal gate mirrors the
// on-chain gates — clock time vs window ends + commit count, never the
// lagging dispute state field (spec §2 law).

/** The reveal preimage (SDK VoteArgs shape): the u64 vote + 32-byte salt. */
export interface StoredVote {
  vote: bigint;
  salt: Uint8Array;
}

/** §8 key convention: the bridge keyed (dispute, round, juror). */
export function saltBridgeKey(dispute: string, round: number, juror: string): string {
  return `riprap.adjudicate.vote.${dispute}.${round}.${juror}`;
}

/** 32 random bytes (spec §4: the salt is generated locally). */
export function randomSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

function hexBytes(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function bytesFromHex(hex: string, length: number): Uint8Array | null {
  if (hex.length !== length * 2 || /[^0-9a-f]/.test(hex)) return null;
  const out = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/** Save the preimage (accord convention: saved when the commitment is sent,
 * so a crash between confirmation and UI update still reveals). */
export function saveStoredVote(key: string, vote: bigint, salt: Uint8Array): void {
  localStorage.setItem(key, JSON.stringify({ vote: String(vote), salt: hexBytes(salt) }));
}

/** Load the preimage; anything malformed fails to null (never a bad vote). */
export function loadStoredVote(key: string): StoredVote | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    const parsed = JSON.parse(raw) as { vote?: unknown; salt?: unknown };
    if (typeof parsed.vote !== "string" || typeof parsed.salt !== "string") return null;
    if (!/^\d+$/.test(parsed.vote)) return null;
    const salt = bytesFromHex(parsed.salt, 32);
    return salt === null ? null : { vote: BigInt(parsed.vote), salt };
  } catch {
    return null;
  }
}

/** The outcome screen's clear (§8: the bridge clears with the outcome). */
export function clearSaltBridge(key: string): void {
  localStorage.removeItem(key);
}

/** The downloadable reveal code's payload — self-describing so the paste
 * target can fail closed on a mismatched seat. */
export interface RevealCode {
  dispute: string;
  round: number;
  choice: 0 | 1;
  salt: Uint8Array;
}

/** The reveal code text (mono, one line): JSON with the salt as 64 hex. */
export function encodeRevealCode(code: RevealCode): string {
  return JSON.stringify({
    dispute: code.dispute,
    round: code.round,
    choice: code.choice,
    salt: hexBytes(code.salt),
  });
}

/** Parse a pasted reveal code; anything malformed or non-binary fails to
 * null — the field is the cross-browser reveal path, not a free vote. */
export function parseRevealCode(text: string): RevealCode | null {
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    if (
      typeof parsed.dispute !== "string" ||
      typeof parsed.round !== "number" ||
      (parsed.choice !== 0 && parsed.choice !== 1) ||
      typeof parsed.salt !== "string"
    ) {
      return null;
    }
    const salt = bytesFromHex(parsed.salt, 32);
    return salt === null
      ? null
      : { dispute: parsed.dispute, round: parsed.round, choice: parsed.choice, salt };
  } catch {
    return null;
  }
}

/** The reveal gate, mirroring the chain (spec §4 step 5): open while the
 * reveal window runs AND the commit window closed or every seat committed
 * (the early-unlock). Pure — the shell feeds the live clock. */
export function revealOpen(
  windows: { commitEnd: bigint; revealEnd: bigint },
  counts: { commitCount: number; jurorCount: number },
  nowSec: bigint,
): boolean {
  return (
    nowSec < windows.revealEnd &&
    (nowSec >= windows.commitEnd || counts.commitCount === counts.jurorCount)
  );
}
