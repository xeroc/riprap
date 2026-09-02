import { readdirSync, statSync } from "node:fs";
import { relative } from "node:path";
import { defineConfig } from "tsup";

/**
 * Collect every oclif command module under src/commands and map it to a
 * dist/commands/<topic>/<name> output key, preserving the topic directory
 * structure oclif relies on for discovery (`commands: "./dist/commands"`).
 *
 * The scaffold ships an empty command tree, so with zero entries we bundle
 * bin/run.js as a placeholder purely because esbuild needs at least one entry
 * point. The placeholder disappears as soon as the first command lands.
 */
function commandEntries(): Record<string, string> {
  const entries: Record<string, string> = {};
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir)) {
      const abs = `${dir}/${name}`;
      if (statSync(abs).isDirectory()) {
        walk(abs);
      } else if (name.endsWith(".ts") && !name.endsWith(".d.ts")) {
        const key = relative("src", abs).replace(/\.ts$/, "");
        entries[key] = abs;
      }
    }
  };
  walk("src/commands");
  if (Object.keys(entries).length === 0) {
    entries[".scaffold-placeholder"] = "bin/run.js";
  }
  return entries;
}

/**
 * Bundle each oclif command into a self-contained ESM module under
 * dist/commands/, inlining the workspace SDK (@riprap/pool; @riprap/hanse
 * joins when its bean lands) so a global install only needs the registry
 * runtime deps (@oclif/core, @oclif/plugin-help, @solana/kit). Shared lib/*
 * helpers are code-split into chunks rather than copied into every command.
 *
 * `keepNames` preserves Command class names that oclif metadata reflects on.
 */
export default defineConfig({
  entry: commandEntries(),
  format: ["esm"],
  target: "es2022",
  outDir: "dist",
  splitting: true,
  sourcemap: true,
  clean: true,
  keepNames: true,
  external: ["@oclif/core", "@oclif/plugin-help", "@solana/kit", "@riprap/pool"],
});
