import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "vitest";

/**
 * Help-completeness pass (bean riprap-7b4e): every command file must load
 * cleanly (a stale or unparseable command file is exactly what makes the
 * oclif scan emit warnings — accord README notes this) and carry a summary
 * + at least one example. Loading is asserted by actually importing every
 * module, not by scanning text.
 */
const commandsRoot = fileURLToPath(new URL("./commands", import.meta.url));

interface CommandModule {
  default: {
    summary: unknown;
    examples: unknown;
  };
}

function commandFiles(dir: string, prefix = ""): { id: string; path: string }[] {
  const out: { id: string; path: string }[] = [];
  for (const name of readdirSync(dir).sort()) {
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) {
      out.push(...commandFiles(abs, `${prefix}${name}/`));
    } else if (name.endsWith(".ts") && !name.endsWith(".test.ts")) {
      const id = `${prefix}${name.replace(/\.ts$/, "")}`.replace(/\//g, ":");
      out.push({ id, path: abs });
    }
  }
  return out;
}

const files = commandFiles(commandsRoot);

test("every command file loads and carries summary + examples", async () => {
  expect(files.length).toBeGreaterThanOrEqual(21); // config 2 + pool 9 + hanse 12
  for (const { id, path } of files) {
    const mod = (await import(path)) as CommandModule;
    const cmd = mod.default;
    expect(typeof cmd, `${id} must default-export a command class`).toBe("function");
    expect(typeof cmd.summary, `${id} needs a static summary`).toBe("string");
    expect((cmd.summary as string).length, `${id} summary is empty`).toBeGreaterThan(0);
    expect(Array.isArray(cmd.examples), `${id} needs static examples`).toBe(true);
    expect((cmd.examples as unknown[]).length, `${id} has no examples`).toBeGreaterThan(0);
  }
});

test("built CLI renders help for every command with zero scan warnings", {
  timeout: 60_000,
}, () => {
  const runJs = fileURLToPath(new URL("../bin/run.js", import.meta.url));
  for (const { id } of files) {
    const res = spawnSync("node", [runJs, id, "--help"], {
      encoding: "utf8",
      env: { ...process.env, NODE_ENV: "production" },
    });
    expect(res.status, `riprap ${id} --help must exit 0 (dist built?)`).toBe(0);
    expect(res.stderr, `oclif emitted scan noise for ${id}`).toBe("");
  }
});
