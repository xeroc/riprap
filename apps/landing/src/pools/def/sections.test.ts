// sections.test.ts — the markdown heading layer: the legacy numbered §
// parser, the free-form `##` parser (fenced code excluded), and the
// title-matched Exclusions lookup.

import { describe, expect, it } from "vitest";
import { parseHeadings, parseSections, sectionByHeading, sectionByNo } from "./sections";

describe("parseSections (legacy numbered §s)", () => {
  it("returns the numbered blocks in order and strips the --- separator", () => {
    const body = "\n## 1. Product\n\nOne.\n\n---\n\n## 3. Covered Event\n\n> Quote\n\n---\n";
    expect(parseSections(body)).toEqual([
      { number: 1, title: "Product", body: "One." },
      { number: 3, title: "Covered Event", body: "> Quote" },
    ]);
  });

  it("ignores unnumbered headings and returns [] for a free-form body", () => {
    expect(parseSections("## Exclusions\n\n- none")).toEqual([]);
    expect(parseSections("Just prose.")).toEqual([]);
  });
});

describe("parseHeadings (free-form body)", () => {
  it("matches numbered and unnumbered headings, keeping the title as written", () => {
    const body = "intro\n\n## 4. Exclusions\n\n- one\n\n## Anything else\n\ntext\n";
    expect(parseHeadings(body)).toEqual([
      { title: "4. Exclusions", body: "- one" },
      { title: "Anything else", body: "text" },
    ]);
  });

  it("does not treat ## inside a fenced code block as a heading", () => {
    const body = "## Real\n\n```md\n## Not a heading\n```\n\n## Also real\n\nbody";
    expect(parseHeadings(body).map((section) => section.title)).toEqual(["Real", "Also real"]);
  });

  it("strips closing hashes, the canonical --- separator, and edge whitespace", () => {
    expect(parseHeadings("## Exclusions ##\n\n- one\n\n---")).toEqual([
      { title: "Exclusions", body: "- one" },
    ]);
  });

  it("returns [] when the body has no ## headings", () => {
    expect(parseHeadings("# One\n### Three\nprose")).toEqual([]);
  });
});

describe("sectionByHeading", () => {
  it("matches Exclusions and 4. Exclusions — the number is optional", () => {
    expect(sectionByHeading("## Exclusions\n\n- one", /exclusions?/i)?.body).toBe("- one");
    expect(sectionByHeading("## 4. Exclusions\n\n- two", /exclusions?/i)?.body).toBe("- two");
  });

  it("returns null when no heading matches", () => {
    expect(sectionByHeading("## Covered event\n\ntext", /exclusions?/i)).toBeNull();
  });
});

describe("sectionByNo", () => {
  it("reads the legacy § by number", () => {
    const sections = parseSections("## 3. Covered Event\n\nA fall.");
    expect(sectionByNo(sections, 3)?.body).toBe("A fall.");
    expect(sectionByNo(sections, 4)).toBeNull();
  });
});
