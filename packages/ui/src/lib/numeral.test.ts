import { describe, expect, it } from "vitest";
import { numeralSegments } from "./numeral";

// DESIGN.md § Typography: "Every numeral renders in JetBrains Mono — inline
// in body text too." These tests pin the split chrome relies on.
describe("numeralSegments — DESIGN.md § Typography (numerals are the hero)", () => {
  it("splits a sentence with one cardinal number", () => {
    expect(numeralSegments("pools created by 3 organizers")).toEqual([
      { text: "pools created by ", numeral: false },
      { text: "3", numeral: true },
      { text: " organizers", numeral: false },
    ]);
  });

  it("keeps thousands separators and decimals inside the numeral run", () => {
    expect(numeralSegments("a $1.61T analog market, 26.1% of it")).toEqual([
      { text: "a $", numeral: false },
      { text: "1.61", numeral: true },
      { text: "T analog market, ", numeral: false },
      { text: "26.1", numeral: true },
      { text: "% of it", numeral: false },
    ]);
  });

  it("leaves trailing punctuation with the prose", () => {
    expect(numeralSegments("raise $700k, post $7M.")).toEqual([
      { text: "raise $", numeral: false },
      { text: "700", numeral: true },
      { text: "k, post $", numeral: false },
      { text: "7", numeral: true },
      { text: "M.", numeral: false },
    ]);
  });

  it("emits one segment per part when text has no numerals at all", () => {
    expect(numeralSegments("dead on schedule")).toEqual([
      { text: "dead on schedule", numeral: false },
    ]);
  });
});
