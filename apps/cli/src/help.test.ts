import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

/**
 * Smoke test for the scaffold: the compiled CLI must boot and render help.
 * Requires `pnpm build` first (bin/run.js loads dist/commands) — the repo's
 * verify lane runs build before test, so that ordering holds there.
 *
 * Topics are declared in package.json (oclif.topics); with an empty command
 * tree oclif does not list them in the top-level help (a topic is only listed
 * once it has children), but each topic page must render and exit 0.
 */
const runJs = fileURLToPath(new URL("../bin/run.js", import.meta.url));

function runCli(...args: string[]): string {
  return execFileSync("node", [runJs, ...args], { encoding: "utf8" });
}

test("riprap --help exits 0 and renders usage", () => {
  const help = runCli("--help");
  expect(help).toContain("riprap");
  expect(help.toLowerCase()).toContain("usage");
});

test.each([
  ["config", "Cluster, wallet and resolved config shared by pool and hanse"],
  ["pool", "Pool program operations (@riprap/pool)"],
  ["hanse", "Hanse event-mutual operations (@riprap/hanse)"],
])("topic %s renders its help page", (topic, description) => {
  const help = runCli(topic, "--help");
  expect(help).toContain(`$ riprap ${topic}:COMMAND`);
  expect(help).toContain(description);
});
