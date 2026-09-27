// vote.ts suite (riprap-2xug): the §8 salt bridge (key convention,
// roundtrip, fails-to-null on corruption), the reveal code (encode/parse
// roundtrip, fails-closed on any mismatch), and the reveal gate mirroring
// the on-chain windows + commit count (spec §4 step 5, §2 clock law).
import { afterEach, describe, expect, it } from "vitest";

import {
  clearSaltBridge,
  encodeRevealCode,
  loadStoredVote,
  parseRevealCode,
  type RevealCode,
  randomSalt,
  revealOpen,
  saltBridgeKey,
  saveStoredVote,
} from "./vote";

const DISPUTE = "D".repeat(32);
const JUROR = "J".repeat(32);
const SALT = new Uint8Array(32).map((_, i) => i);

afterEach(() => {
  localStorage.clear();
});

describe("salt bridge — §8 keyed (dispute, round, juror), accord convention", () => {
  it("keys the bridge by dispute, round, juror", () => {
    expect(saltBridgeKey(DISPUTE, 2, JUROR)).toBe(`riprap.adjudicate.vote.${DISPUTE}.2.${JUROR}`);
  });

  it("roundtrips the preimage; the salt stays 32 bytes hex", () => {
    const key = saltBridgeKey(DISPUTE, 0, JUROR);
    saveStoredVote(key, 1n, SALT);
    const stored = loadStoredVote(key);
    expect(stored?.vote).toBe(1n);
    expect(Array.from(stored?.salt ?? [])).toEqual(Array.from(SALT));
  });

  it("fails to null on missing, corrupt, or malformed entries — never a bad vote", () => {
    const key = saltBridgeKey(DISPUTE, 0, JUROR);
    expect(loadStoredVote(key)).toBeNull();
    localStorage.setItem(key, "{not json");
    expect(loadStoredVote(key)).toBeNull();
    localStorage.setItem(key, JSON.stringify({ vote: "0", salt: "00".repeat(31) }));
    expect(loadStoredVote(key)).toBeNull();
    localStorage.setItem(key, JSON.stringify({ vote: "x", salt: "00".repeat(32) }));
    expect(loadStoredVote(key)).toBeNull();
  });

  it("clearSaltBridge empties the key (the outcome screen's clear)", () => {
    const key = saltBridgeKey(DISPUTE, 0, JUROR);
    saveStoredVote(key, 0n, SALT);
    clearSaltBridge(key);
    expect(loadStoredVote(key)).toBeNull();
  });

  it("randomSalt mints 32 fresh bytes", () => {
    const a = randomSalt();
    const b = randomSalt();
    expect(a).toHaveLength(32);
    expect(Array.from(a)).not.toEqual(Array.from(b));
  });
});

describe("reveal code — salt + choice, mono, fails closed", () => {
  it("roundtrips through text", () => {
    const code: RevealCode = { dispute: DISPUTE, round: 3, choice: 1, salt: SALT };
    const parsed = parseRevealCode(encodeRevealCode(code));
    expect(parsed?.dispute).toBe(DISPUTE);
    expect(parsed?.round).toBe(3);
    expect(parsed?.choice).toBe(1);
    expect(Array.from(parsed?.salt ?? [])).toEqual(Array.from(SALT));
  });

  it("rejects malformed text, wrong salt length, and a third option", () => {
    expect(parseRevealCode("not json")).toBeNull();
    expect(
      parseRevealCode(
        JSON.stringify({ dispute: DISPUTE, round: 0, choice: 2, salt: "00".repeat(32) }),
      ),
    ).toBeNull();
    expect(
      parseRevealCode(
        JSON.stringify({ dispute: DISPUTE, round: 0, choice: 0, salt: "0".repeat(63) }),
      ),
    ).toBeNull();
  });
});

describe("revealOpen — mirrors the on-chain gate (clock + commit count)", () => {
  const windows = { commitEnd: 200n, revealEnd: 300n };

  it("closed before commit_end unless every seat committed (the early unlock)", () => {
    expect(revealOpen(windows, { commitCount: 1, jurorCount: 3 }, 150n)).toBe(false);
    expect(revealOpen(windows, { commitCount: 3, jurorCount: 3 }, 150n)).toBe(true);
  });

  it("open from commit_end; closed at reveal_end", () => {
    expect(revealOpen(windows, { commitCount: 0, jurorCount: 3 }, 200n)).toBe(true);
    expect(revealOpen(windows, { commitCount: 3, jurorCount: 3 }, 300n)).toBe(false);
  });
});
