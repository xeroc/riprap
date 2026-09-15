#!/usr/bin/env node

// Production entry — loads compiled commands from ./dist/commands (run `pnpm build` first).

import { execute } from "@oclif/core";

await execute({ dir: import.meta.url });
