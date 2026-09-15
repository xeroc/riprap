import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, describe, expect, test } from "vitest";

import { writeKeypairFile } from "../../lib/keypair-file";

/**
 * Command-level tests driven through `bin/dev.js` under bun (no validator
 * needed): help rendering, flag surface, and the unreachable-RPC error path
 * via a mock env — the @useaccord/cli test pattern ported to vitest.
 */
const cliRoot = fileURLToPath(new URL("../../..", import.meta.url));
const devJs = join(cliRoot, "bin", "dev.js");

const tempDirs: string[] = [];

afterAll(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
});

interface CliResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

function runCli(args: string[], env: Record<string, string | undefined> = {}): CliResult {
  return spawnSync("bun", [devJs, ...args], {
    encoding: "utf8",
    cwd: cliRoot,
    env: {
      ...process.env,
      RIPRAP_KEYPAIR_PATH: undefined,
      ANCHOR_WALLET: undefined,
      ...env,
    },
  });
}

function tempKeypairPath(): string {
  const dir = mkdtempSync(join(tmpdir(), "riprap-cli-"));
  tempDirs.push(dir);
  return writeKeypairFile(dir);
}

describe("riprap config:show", () => {
  test("--help renders the chain flag surface", () => {
    const res = runCli(["config:show", "--help"]);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("--rpc");
    expect(res.stdout).toContain("--keypair");
    expect(res.stdout).toContain("--json");
    expect(res.stdout).toContain("--dry-run");
  });

  test("unreachable rpc exits non-zero with RpcUnreachable (human mode)", () => {
    const res = runCli(["config:show", "--keypair", tempKeypairPath()], {
      RIPRAP_RPC_URL: "http://127.0.0.1:1",
    });
    expect(res.status).not.toBe(0);
    expect(res.stderr).toContain("RpcUnreachable");
    expect(res.stderr).toContain("RIPRAP_RPC_URL");
  });

  test("unreachable rpc in --json mode emits a structured error on stderr", () => {
    const res = runCli(["config:show", "--json", "--keypair", tempKeypairPath()], {
      RIPRAP_RPC_URL: "http://127.0.0.1:1",
    });
    expect(res.status).not.toBe(0);
    const parsed = JSON.parse(res.stderr);
    expect(parsed.error).toBe("RpcUnreachable");
    expect(parsed.message).toBeTruthy();
  });
});

describe("riprap config:balance", () => {
  test("--help documents the address arg and --token-mint", () => {
    const res = runCli(["config:balance", "--help"]);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("--token-mint");
    expect(res.stdout).toContain("ADDRESS");
    expect(res.stdout).toContain("--keypair");
  });
});
