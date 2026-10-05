import { describe, expect, it } from "vitest";

import {
  BRAND_CLOSE_DURATION,
  BRAND_CLOSE_HOLD_FROM,
  BRAND_OPEN_DURATION,
  BRAND_OPEN_HOLD_FROM,
  DEFAULT_CLOSE_LINE,
  DEFAULT_HEADLINE,
  DEFAULT_KICKER,
} from "./brand";

/**
 * The brand-beat law (founder directive 2026-10-05): every video opens on
 * the ink beat and closes on the lockup, and both carry a true-still wordmark
 * hold of at least one second (aesthetic R1).
 */
describe("brand beats — the every-video open/close law", () => {
  it("open holds the complete lockup >= 1s after all entrances settle", () => {
    expect(BRAND_OPEN_HOLD_FROM).toBeLessThanOrEqual(45); // entrances done by ~f42
    expect(BRAND_OPEN_DURATION - BRAND_OPEN_HOLD_FROM).toBeGreaterThanOrEqual(30);
  });

  it("close holds the lockup >= 1s after the settle", () => {
    expect(BRAND_CLOSE_HOLD_FROM).toBeLessThanOrEqual(15); // settle done by f14
    expect(BRAND_CLOSE_DURATION - BRAND_CLOSE_HOLD_FROM).toBeGreaterThanOrEqual(30);
  });

  it("default copy carries the platform register", () => {
    expect(DEFAULT_KICKER).toBe("MUTUALS ON SOLANA"); // landing §1 head title
    expect(DEFAULT_HEADLINE).toBe("Your group's got you covered."); // landing §1 H1
    expect(DEFAULT_CLOSE_LINE).toBe("Mutuals as an open protocol."); // founder 2026-10-05
  });
});
