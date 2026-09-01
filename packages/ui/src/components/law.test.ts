import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * DESIGN.md law, grep-verifiable on the chrome layer's own source:
 *  - zero `shadow-*` utilities (hairlines + tone steps are the only depth)
 *  - zero rounded geometry beyond the sanctioned exceptions: `rounded-none`
 *    everywhere, `rounded-input` (2px) on form controls, `rounded-full` only
 *    in avatar.tsx (the avatar disc is the only circle)
 *  - zero inline hex colors (colors live in tokens.css only)
 */
const SANCTIONED_FULL_RADIUS: Record<string, true> = {}; // avatar retired; no circles remain
const ROOT = join(__dirname);

function collect(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...collect(full));
    } else if (/\.(tsx|ts)$/.test(entry) && !/\.(test|stories)\.tsx?$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

const files = collect(ROOT);

describe("DESIGN.md law — chrome layer source", () => {
  it("has files to check", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it("no shadow utilities anywhere", () => {
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      expect(src, file).not.toMatch(/shadow-/);
    }
  });

  it("sharp geometry: no rounded-{sm..full} outside the sanctioned exceptions", () => {
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      const base = file.split("/").pop() ?? file;
      if (SANCTIONED_FULL_RADIUS[base]) continue;
      expect(src, file).not.toMatch(
        /rounded-(sm|md|lg|xl|2xl|3xl|4xl|full|t-|b-|l-|r-|tl|tr|bl|br)/,
      );
    }
  });

  it("no circles remain — sharp geometry only (avatar retired in the lean cut)", () => {
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      expect(src, file).not.toMatch(/rounded-full/);
    }
  });

  it("no inline hex colors — tokens only", () => {
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      expect(src, file).not.toMatch(/#[0-9a-fA-F]{6}\b/);
      expect(src, file).not.toMatch(/#([0-9a-fA-F]{3})\b(?![-\w])/);
    }
  });

  it("settle motion only: 160ms ease-out, no bounce easings", () => {
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      expect(src, file).not.toMatch(/animate-bounce|ease-in-out|ease-elastic|spring/);
    }
  });
});
