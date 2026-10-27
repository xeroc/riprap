# syntax=docker/dockerfile:1
#
# Riprap Cranker — container image.
#
# This is a pnpm-workspace member that depends on @riprap/pool + @riprap/hanse
# (workspace:*), NOT a standalone bun project. The image is built in four phases:
#   1. pnpm install the full workspace from the repo lockfile (cached layer)
#   2. build the SDKs (pool's exports resolve dist once packed; hanse ships src)
#      + typecheck the cranker
#   3. `pnpm deploy` prunes to a self-contained dir, copied into a bun runtime
#
# Build context = repo ROOT:
#   docker build -f apps/cranker/Dockerfile .
#

############################
# 1. Workspace deps (cached)
############################
FROM node:22-slim AS deps
RUN corepack enable
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
# Copy EVERY workspace member's manifest: --frozen-lockfile validates the full
# graph the lockfile was generated against, so partial manifests fail it.
# Keep this list in sync with the `importers:` section of pnpm-lock.yaml.

COPY packages/pool/package.json packages/pool/
COPY packages/hanse/package.json packages/hanse/
COPY packages/ui/package.json packages/ui/

COPY apps/cli/package.json apps/cli/
COPY apps/cranker/package.json apps/cranker/
COPY apps/landing/package.json apps/landing/
COPY apps/remotion/package.json apps/remotion/
COPY apps/pitches/2026-11-demo-worlds-fair/package.json apps/pitches/2026-11-demo-worlds-fair/
COPY apps/pitches/2026-11-pitch-seed-raise/package.json apps/pitches/2026-11-pitch-seed-raise/
COPY apps/pitches/2026-12-angel-round/package.json apps/pitches/2026-12-angel-round/

COPY tests/package.json tests/
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --fetch-retries 5 --fetch-timeout 300000

############################
# 2. Build SDKs + typecheck app
############################
FROM deps AS build

COPY packages/pool packages/pool
COPY packages/hanse packages/hanse

COPY apps/cranker apps/cranker

# Generated Codama clients are committed; no anchor/IDL step needed.
RUN pnpm --filter @riprap/pool \
    --filter @riprap/hanse \
    --filter @riprap/cranker \
    build

############################
# 3. Prune to one self-contained package
############################
FROM build AS deploy
RUN pnpm deploy --legacy --filter=@riprap/cranker --prod /out

############################
# 4. Runtime — bun only
############################
FROM oven/bun:1-debian AS release
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deploy /out ./
USER bun
# No port: the cranker is a 60s reconciler poll loop over the mutual lifecycle.
ENTRYPOINT ["bun", "run", "src/index.ts"]
