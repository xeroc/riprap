/**
 * Reconciler decision matrix — one fake world, every lifecycle gate. The
 * fake rpc implements getProgramAccounts with REAL memcmp semantics (base64
 * filters at byte offsets against base64 account data) and getAccountInfo
 * from the same world, so the SDK scan helpers run their true path. The
 * accord Dispute read is module-mocked: its fixture surface (CaseTerms et al)
 * is heavier than the single `state` field the reconciler consumes.
 */
import { vi } from "vitest";

// vi.mock factories hoist above imports — shared state must hoist too.
const { disputeReads, disputeState } = vi.hoisted(() => ({
  disputeReads: [] as { address: string; state: number; exists: boolean }[],
  disputeState: {
    Created: 0,
    Drawn: 1,
    Review: 2,
    Commit: 3,
    Reveal: 4,
    RoundResolved: 5,
    Final: 6,
    Closed: 7,
    Failed: 8,
    RedrawEligible: 9,
  } as const,
}));

vi.mock("@useaccord/sdk", () => ({
  DisputeState: disputeState,
  fetchMaybeDispute: vi.fn(async (_rpc: unknown, address: string) => {
    const found = disputeReads.find((d) => d.address === address);
    return found?.exists
      ? { exists: true, address, data: { state: found.state } }
      : { exists: false, address, data: null };
  }),
}));

import {
  ClaimStatus,
  getClaimEncoder,
  getMutualEncoder,
  HANSE_PROGRAM_ADDRESS,
  Phase,
} from "@riprap/hanse";
import {
  findDepositorPda,
  getDepositorEncoder,
  getPoolEncoder,
  POOL_PROGRAM_ADDRESS,
  PoolState,
} from "@riprap/pool";
import {
  type Address,
  getBase64Decoder,
  getBase64Encoder,
  type Rpc,
  type SolanaRpcApi,
} from "@solana/kit";
import { beforeEach, describe, expect, test } from "vitest";

import type { CrankDispatch } from "./dispatch.js";
import { type ReconcilerConfig, reconcileOnce } from "./reconciler.js";
import type { CrankAction } from "./types.js";

const AUTHORITY = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM" as Address;
const STRANGER = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" as Address;
const MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" as Address;
const NOW = 5_000n;

interface WorldItem {
  pubkey: string;
  program: Address;
  data: string; // base64
}

/** Recording dispatch: captures actions, executes nothing. */
function recordingDispatch(failOn?: CrankAction["kind"]) {
  const actions: CrankAction[] = [];
  const dispatch: CrankDispatch = {
    register() {},
    has: () => true,
    async execute(_ctx, action) {
      if (failOn === action.kind) {
        throw new Error("simulated failure");
      }
      actions.push(action);
      return true;
    },
  };
  return { dispatch, actions };
}

/**
 * Structural rpc with honest filter semantics: memcmp filters decode from
 * base64 and compare against decoded account bytes at the byte offset.
 */
function worldRpc(items: WorldItem[]): Rpc<SolanaRpcApi> {
  const bytesOf = (data: string) => getBase64Encoder().encode(data);
  const matches = (item: WorldItem, filters: { memcmp?: { offset: bigint; bytes: string } }[]) =>
    filters.every((f) => {
      if (f.memcmp === undefined) {
        return true;
      }
      const want = bytesOf(f.memcmp.bytes);
      const have = bytesOf(item.data).slice(Number(f.memcmp.offset));
      return want.every((b, i) => b === have[i]);
    });
  return {
    getProgramAccounts: (program: string, config: { filters?: unknown }) => ({
      send: async () =>
        items
          .filter((i) => i.program === program)
          .filter((i) =>
            matches(i, (config.filters ?? []) as { memcmp?: { offset: bigint; bytes: string } }[]),
          )
          .map((i) => ({ pubkey: i.pubkey, account: { data: [i.data, "base64"] } })),
    }),
    getAccountInfo: (address: string) => ({
      send: async () => {
        const item = items.find((i) => i.pubkey === address);
        return {
          value: item
            ? {
                data: [item.data, "base64"],
                executable: false,
                lamports: 0n,
                owner: item.program,
                rentEpoch: 0n,
                space: 0n,
              }
            : null,
        };
      },
    }),
  } as unknown as Rpc<SolanaRpcApi>;
}

// ── fixtures (arbitrary values — deliberately NOT the policy tier table) ────

const MUTUAL_A = "8tbQtT6ibfn7LVnbBQyq7RD6rNhihFtW3wuNqge4hC15" as Address;
const CLAIM_A = "4bekpLT5StxaBBYnKuCipnyg6fwsyy2KEYCTaN7E6Pti" as Address;
const DISPUTE_A = "3bekpLT5StxaBBYnKuCipnyg6fwsyy2KEYCTaN7E6Pti" as Address;
const POOL_A = "2bekpLT5StxaBBYnKuCipnyg6fwsyy2KEYCTaN7E6Pti" as Address;
const MEMBER = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL" as Address;

function mutualItem(overrides: {
  phase: Phase;
  authority?: Address;
  claimsCloseAt?: bigint;
  pullCloseAt?: bigint;
  claimsFiled?: number;
  claimsResolved?: number;
}): WorldItem {
  return {
    pubkey: MUTUAL_A,
    program: HANSE_PROGRAM_ADDRESS,
    data: getBase64Decoder().decode(
      getMutualEncoder().encode({
        authority: overrides.authority ?? AUTHORITY,
        pool: POOL_A,
        subaccord: STRANGER,
        jurorCredential: STRANGER,
        jurorSchema: STRANGER,
        depositMint: MINT,
        feeMint: MINT,
        policyHash: new Uint8Array(32),
        tiers: [
          { contribution: 1n, maxPayout: 2n },
          { contribution: 3n, maxPayout: 4n },
          { contribution: 5n, maxPayout: 6n },
        ],
        depositsCloseAt: 100n,
        claimsCloseAt: overrides.claimsCloseAt ?? 200n,
        pullWindow: 300n,
        seed: 42n,
        phase: overrides.phase,
        pullCloseAt: overrides.pullCloseAt ?? 600n,
        ratio1e9: 1_000_000_000n,
        obligations: 0n,
        feeRefunds: 0n,
        claimsFiled: overrides.claimsFiled ?? 1,
        claimsResolved: overrides.claimsResolved ?? 0,
        claimNonce: 1n,
        bump: 255,
      }),
    ),
  };
}

function claimItem(status: ClaimStatus): WorldItem {
  return {
    pubkey: CLAIM_A,
    program: HANSE_PROGRAM_ADDRESS,
    data: getBase64Decoder().decode(
      getClaimEncoder().encode({
        mutual: MUTUAL_A,
        member: MEMBER,
        claimAmount: 7n,
        dispute: DISPUTE_A,
        feePaid: 9n,
        status,
        filedAt: 100n,
        settledAt: 0n,
        bump: 255,
      }),
    ),
  };
}

function poolItem(state: PoolState): WorldItem {
  return {
    pubkey: POOL_A,
    program: POOL_PROGRAM_ADDRESS,
    data: getBase64Decoder().decode(
      getPoolEncoder().encode({
        seed: 42n,
        mint: MINT,
        ownershipAuthority: AUTHORITY,
        ownershipRate: 0n,
        rightsAuthority: AUTHORITY,
        rightsRate: 1n,
        yieldAuthority: AUTHORITY,
        yieldRate: 0n,
        totalAmount: 100n,
        state,
        liquidationBalance: 100n,
        bump: 255,
      }),
    ),
  };
}

async function depositorItem(owner: Address, total: bigint, settled: boolean): Promise<WorldItem> {
  // The SDK scan matches each account against the derived PDA — fixtures
  // must sit at the real ["depositor", pool, owner] address.
  const [pda] = await findDepositorPda({ pool: POOL_A, owner });
  return {
    pubkey: pda,
    program: POOL_PROGRAM_ADDRESS,
    data: getBase64Decoder().decode(
      getDepositorEncoder().encode({
        owner,
        residualBeneficiary: "11111111111111111111111111111111" as Address,
        totalAmount: total,
        ownershipStake: 0n,
        rightsStake: 0n,
        yieldStake: 0n,
        settled,
      }),
    ),
  };
}

function config(
  items: WorldItem[],
  dispatch: CrankDispatch,
  cranker: Address = AUTHORITY,
): ReconcilerConfig {
  return {
    rpc: worldRpc(items),
    signer: {} as ReconcilerConfig["signer"],
    cranker,
    dispatch,
    sendIx: async () => "sig",
    now: () => NOW,
    log: () => {},
  };
}

beforeEach(() => {
  disputeReads.length = 0;
});

describe("reconcileOnce — Active", () => {
  test("terminal dispute → settle_claim; settle_pool deferred one cycle", async () => {
    disputeReads.push({ address: DISPUTE_A, state: disputeState.Final, exists: true });
    const rec = recordingDispatch();
    const executed = await reconcileOnce(
      config([mutualItem({ phase: Phase.Active }), claimItem(ClaimStatus.Pending)], rec.dispatch),
    );
    expect(executed).toBe(1);
    expect(rec.actions).toEqual([{ kind: "settle_claim", mutual: MUTUAL_A, claim: CLAIM_A }]);
  });

  test("live dispute → nothing; window open does not settle the pool", async () => {
    disputeReads.push({ address: DISPUTE_A, state: disputeState.Reveal, exists: true });
    const rec = recordingDispatch();
    const executed = await reconcileOnce(
      config([mutualItem({ phase: Phase.Active }), claimItem(ClaimStatus.Pending)], rec.dispatch),
    );
    expect(executed).toBe(0);
    expect(rec.actions).toEqual([]);
  });

  test("window passed, all resolved, nothing pending → settle_pool", async () => {
    const rec = recordingDispatch();
    const executed = await reconcileOnce(
      config(
        [
          mutualItem({
            phase: Phase.Active,
            claimsCloseAt: NOW - 1n,
            claimsFiled: 1,
            claimsResolved: 1,
          }),
        ],
        rec.dispatch,
      ),
    );
    expect(executed).toBe(1);
    expect(rec.actions).toEqual([{ kind: "settle_pool", mutual: MUTUAL_A }]);
  });

  test("window passed but claims unresolved → nothing (§2.5 last-dispute wait)", async () => {
    const rec = recordingDispatch();
    const executed = await reconcileOnce(
      config(
        [
          mutualItem({
            phase: Phase.Active,
            claimsCloseAt: NOW - 1n,
            claimsFiled: 2,
            claimsResolved: 1,
          }),
        ],
        rec.dispatch,
      ),
    );
    expect(executed).toBe(0);
  });

  test("window not yet passed → nothing", async () => {
    const rec = recordingDispatch();
    const executed = await reconcileOnce(
      config(
        [
          mutualItem({
            phase: Phase.Active,
            claimsCloseAt: NOW + 1n,
            claimsFiled: 1,
            claimsResolved: 1,
          }),
        ],
        rec.dispatch,
      ),
    );
    expect(executed).toBe(0);
  });
});

describe("reconcileOnce — Settled", () => {
  test("authority cranker + Approved claim inside the window → claim_payout", async () => {
    const rec = recordingDispatch();
    const executed = await reconcileOnce(
      config(
        [
          mutualItem({ phase: Phase.Settled, pullCloseAt: NOW + 1n }),
          claimItem(ClaimStatus.Approved),
        ],
        rec.dispatch,
      ),
    );
    expect(executed).toBe(1);
    expect(rec.actions).toEqual([{ kind: "claim_payout", mutual: MUTUAL_A, claim: CLAIM_A }]);
  });

  test("non-authority cranker skips payouts (pilot pass gate, ADR-0005)", async () => {
    const rec = recordingDispatch();
    const executed = await reconcileOnce(
      config(
        [
          mutualItem({ phase: Phase.Settled, pullCloseAt: NOW + 1n }),
          claimItem(ClaimStatus.Approved),
        ],
        rec.dispatch,
        STRANGER,
      ),
    );
    expect(executed).toBe(0);
    expect(rec.actions).toEqual([]);
  });

  test("past pull_close_at → dissolve", async () => {
    const rec = recordingDispatch();
    const executed = await reconcileOnce(
      config([mutualItem({ phase: Phase.Settled, pullCloseAt: NOW })], rec.dispatch),
    );
    expect(executed).toBe(1);
    expect(rec.actions).toEqual([{ kind: "dissolve", mutual: MUTUAL_A }]);
  });
});

describe("reconcileOnce — Dissolved", () => {
  test("liquidated pool → pool_crank per unsettled, non-zero depositor only", async () => {
    const rec = recordingDispatch();
    const settledPos = await depositorItem(STRANGER, 5n, true);
    const burnedPos = await depositorItem(MEMBER, 0n, false);
    const livePos = await depositorItem(AUTHORITY, 20n, false);
    const executed = await reconcileOnce(
      config(
        [
          mutualItem({ phase: Phase.Dissolved }),
          poolItem(PoolState.Liquidated),
          settledPos,
          burnedPos,
          livePos,
        ],
        rec.dispatch,
      ),
    );
    expect(executed).toBe(1);
    expect(rec.actions).toEqual([{ kind: "pool_crank", pool: POOL_A, owner: AUTHORITY }]);
  });

  test("pool not yet liquidated → nothing", async () => {
    const rec = recordingDispatch();
    const position = await depositorItem(MEMBER, 20n, false);
    const executed = await reconcileOnce(
      config(
        [mutualItem({ phase: Phase.Dissolved }), poolItem(PoolState.Open), position],
        rec.dispatch,
      ),
    );
    expect(executed).toBe(0);
  });
});

describe("reconcileOnce — failure isolation", () => {
  test("a failing crank attempt logs and the cycle continues", async () => {
    disputeReads.push({ address: DISPUTE_A, state: disputeState.Final, exists: true });
    const rec = recordingDispatch("settle_claim");
    const executed = await reconcileOnce(
      config([mutualItem({ phase: Phase.Active }), claimItem(ClaimStatus.Pending)], rec.dispatch),
    );
    expect(executed).toBe(0); // failed attempt does not count as executed
  });

  test("a broken mutual scan never kills the cycle", async () => {
    const rec = recordingDispatch();
    // no items → discovery returns zero mutuals, cycle exits cleanly
    const executed = await reconcileOnce(config([], rec.dispatch));
    expect(executed).toBe(0);
  });
});
