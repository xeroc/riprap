/**
 * Crank dispatch — the single merge point between the reconciler and the
 * per-crank implementations (ported from @useaccord/cranker src/dispatch.ts).
 * The map starts empty; each crank registers its handler in its own module
 * (`src/cranks/hanse/<name>.ts` / `src/cranks/pool/crank.ts` calls
 * {@link registerCrank}). The reconciler never imports a crank directly — it
 * looks the action kind up here. That keeps every crank an independent
 * addition: no shared file is edited to ship one.
 */
import type { Address } from "@solana/kit";

import type { ActionOf, CrankAction, CrankContext, CrankKind, CrankResult } from "./types.js";

// Re-exported so crank authors import everything from one place.
export type { ActionOf, CrankAction, CrankContext, CrankKind, CrankResult };

/** A registered crank: receives the context + the resolved action. */
export type CrankHandler = (ctx: CrankContext, action: CrankAction) => Promise<void>;

export interface CrankDispatch {
  /** Register a handler for an action kind. Throws on duplicate registration. */
  register(kind: CrankKind, handler: CrankHandler): void;
  /** Run the handler for `action.kind`. Returns true iff a handler ran. */
  execute(ctx: CrankContext, action: CrankAction): Promise<boolean>;
  /** Whether a handler is registered for `kind`. */
  has(kind: CrankKind): boolean;
}

export function createCrankDispatch(): CrankDispatch {
  const handlers = new Map<CrankKind, CrankHandler>();
  return {
    register(kind, handler) {
      if (handlers.has(kind)) {
        throw new Error(`crank "${kind}" already registered`);
      }
      handlers.set(kind, handler);
    },
    async execute(ctx, action) {
      const handler = handlers.get(action.kind);
      if (handler === undefined) {
        return false;
      }
      await handler(ctx, action);
      return true;
    },
    has(kind) {
      return handlers.has(kind);
    },
  };
}

/**
 * Register one executor (`execute: (ctx, action) => Promise<CrankResult>`)
 * as a handler that also logs deliberate skips.
 */
export function registerCrank<K extends CrankKind>(
  dispatch: CrankDispatch,
  kind: K,
  execute: (ctx: CrankContext, action: ActionOf<K>) => Promise<CrankResult>,
): void {
  dispatch.register(kind, async (ctx, action) => {
    const result = await execute(ctx, action as ActionOf<K>);
    if (result.skipped !== undefined) {
      ctx.log(kind, subjectOf(action), `skipped: ${result.skipped}`);
    }
  });
}

/** The account a crank action targets: the Claim PDA for claim cranks, the
 * Mutual PDA for lifecycle cranks, the depositor owner for the pool crank. */
function subjectOf(action: CrankAction): Address | null {
  switch (action.kind) {
    case "settle_claim":
    case "claim_payout":
      return action.claim;
    case "settle_pool":
    case "dissolve":
      return action.mutual;
    case "pool_crank":
      return action.owner;
  }
}
