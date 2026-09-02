import { Track } from "@riprap/pool";

/** The three pool track names, as accepted on the command line. */
export const TRACK_OPTIONS = ["ownership", "rights", "yield"] as const;

const TRACK_BY_NAME = {
  ownership: Track.Ownership,
  rights: Track.Rights,
  yield: Track.Yield,
} as const;

/** Map a `--track` flag value to the SDK `Track` enum. */
export function trackFromName(name: string): Track {
  const track = TRACK_BY_NAME[name as keyof typeof TRACK_BY_NAME];
  if (track === undefined) {
    throw new Error(`Unknown track "${name}" (expected ownership, rights, or yield).`);
  }
  return track;
}

/** Parse a non-negative decimal integer that must fit `maxBits` (u64/u128). */
export function toBigInt(label: string, raw: string, maxBits: 64 | 128): bigint {
  let value: bigint;
  try {
    value = BigInt(raw);
  } catch {
    throw new Error(`${label} must be an integer (got "${raw}").`);
  }
  if (value < 0n) throw new Error(`${label} must be non-negative (got ${raw}).`);
  if (value >= 1n << BigInt(maxBits)) {
    throw new Error(`${label} does not fit u${maxBits} (got ${raw}).`);
  }
  return value;
}
