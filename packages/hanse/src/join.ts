/**
 * Build-only join facade (milestone riprap-9ehc HANDOFF §2/§4): everything a
 * wallet needs to chip in, and nothing that sends. `getJoinContext` is the
 * pre-flight read the pool-page hero renders; `buildJoinInstructions`
 * re-runs every guard at click time and returns [idempotent ATA-create,
 * hanse::join] for the caller to sign and send as ONE transaction.
 * Blockhash/sign/send never lives in the SDK — that is
 * apps/landing/src/shared/transaction.ts.
 */
import {
  findAssociatedTokenAddress,
  getCreateAssociatedTokenIdempotentInstruction,
} from "@riprap/pool";
import {
  type Account,
  type Address,
  type GetAccountInfoApi,
  type GetBalanceApi,
  type GetTokenAccountBalanceApi,
  type Instruction,
  isSolanaError,
  type Rpc,
  type TransactionSigner,
} from "@solana/kit";
import { fetchMutual, getJoinInstructionAsync, type Mutual } from "../generated/src/generated";
import { fetchMaybeMemberByOwner } from "./fetch";
import {
  findDepositorPda,
  findJoinMemberAccountPda,
  findSasAttestationPda,
  findSasCredentialPda,
  findSasSchemaPda,
  SAS_PROGRAM_ADDRESS,
} from "./pdas";

/**
 * Minimal structural rpc the facade calls: account reads via the generated
 * fetchers plus the two balance methods. Admits both `createDefaultSolanaRpc`
 * outputs (accord app convention) and the CLI's cluster-capable rpc union —
 * no casts at either consumer.
 */
export type JoinRpc = Rpc<GetAccountInfoApi & GetBalanceApi & GetTokenAccountBalanceApi>;

// --- typed errors (name-stable: the hero maps constructor names to toasts) ---

/** Join attempted at/after deposits_close_at (EVENT-MUTUAL §2.7). */
export class DepositsClosed extends Error {
  readonly depositsCloseAt: bigint;

  constructor(depositsCloseAt: bigint) {
    super(`deposits closed at ${depositsCloseAt} — join reverts at/after it (EVENT-MUTUAL §2.7)`);
    this.name = "DepositsClosed";
    this.depositsCloseAt = depositsCloseAt;
  }
}

/** Tier index outside Mutual.tiers — a caller bug, not a chain state. */
export class TierInvalid extends Error {
  readonly tier: number;
  readonly tiers: number;

  constructor(tier: number, tiers: number) {
    super(`tier ${tier} is outside Mutual.tiers (0..${tiers - 1})`);
    this.name = "TierInvalid";
    this.tier = tier;
    this.tiers = tiers;
  }
}

/** The Member PDA already exists — one tier per member (init enforces it). */
export class AlreadyMember extends Error {
  readonly tier: number;

  constructor(tier: number) {
    super(`already a member at tier ${tier} — one tier per member`);
    this.name = "AlreadyMember";
    this.tier = tier;
  }
}

/** Deposit-mint balance below the tier contribution (missing ATA reads as 0). */
export class InsufficientBalance extends Error {
  readonly balance: bigint;
  readonly required: bigint;

  constructor(balance: bigint, required: bigint) {
    super(`deposit-mint balance ${balance} is below the ${required} contribution`);
    this.name = "InsufficientBalance";
    this.balance = balance;
    this.required = required;
  }
}

/** Mutual deadlines are unix seconds (Clock::unix_timestamp); Date.now() is ms. */
function nowUnixSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

// --- pre-flight read ---

/** Why canJoin is false — name-stable for the pool-page inline reason. */
export type JoinBlockedReason =
  | "already-member"
  | "deposits-closed"
  | "insufficient-balance"
  | "insufficient-sol";

export type JoinContext = {
  mutual: Account<Mutual>;
  /** The account hanse::join initializes — ["member", mutual, wallet]. */
  memberAccount: Address;
  /** The member's on-chain tier when the Member PDA exists, else null. */
  alreadyMember: { tier: number } | null;
  /** Cheapest tier contribution — the tier-agnostic "chip in from" number. */
  contribution: bigint;
  /** Deposit-mint balance of the wallet's ATA (missing ATA = 0n). */
  depositBalance: bigint;
  solBalance: bigint;
  depositsOpen: boolean;
  canJoin: boolean;
  reason?: JoinBlockedReason;
};

export async function getJoinContext(
  rpc: JoinRpc,
  seeds: { mutual: Address; wallet: Address },
): Promise<JoinContext> {
  const mutual = await fetchMutual(rpc, seeds.mutual);
  const m = mutual.data;

  const [memberAccount] = await findJoinMemberAccountPda({
    mutual: seeds.mutual,
    member: seeds.wallet,
  });
  const existing = await fetchMaybeMemberByOwner(rpc, {
    mutual: seeds.mutual,
    member: seeds.wallet,
  });
  const alreadyMember = existing.exists ? { tier: existing.data.tier } : null;

  const ownerAta = await findAssociatedTokenAddress(m.depositMint, seeds.wallet);
  const depositBalance = await tokenBalanceOrZero(rpc, ownerAta);
  const { value: solBalance } = await rpc.getBalance(seeds.wallet).send();
  const depositsOpen = nowUnixSeconds() < Number(m.depositsCloseAt);
  const contribution = m.tiers.reduce(
    (lowest, tier) => (tier.contribution < lowest ? tier.contribution : lowest),
    m.tiers[0]?.contribution ?? 0n,
  );

  // First blocker wins; per-tier affordability is the UI's call — both
  // depositBalance and mutual.tiers are in the context.
  let reason: JoinBlockedReason | undefined;
  if (alreadyMember) {
    reason = "already-member";
  } else if (!depositsOpen) {
    reason = "deposits-closed";
  } else if (depositBalance < contribution) {
    reason = "insufficient-balance";
  } else if (solBalance <= 0n) {
    reason = "insufficient-sol";
  }

  return {
    mutual,
    memberAccount,
    alreadyMember,
    contribution,
    depositBalance,
    solBalance,
    depositsOpen,
    canJoin: reason === undefined,
    ...(reason ? { reason } : {}),
  };
}

// --- instruction assembly ---

export async function buildJoinInstructions(
  rpc: JoinRpc,
  input: { mutual: Address; tier: number; member: TransactionSigner },
): Promise<Instruction[]> {
  const account = await fetchMutual(rpc, input.mutual);
  const m = account.data;

  if (nowUnixSeconds() >= Number(m.depositsCloseAt)) {
    throw new DepositsClosed(m.depositsCloseAt);
  }
  const tier = m.tiers[input.tier];
  if (tier === undefined) {
    throw new TierInvalid(input.tier, m.tiers.length);
  }

  const existing = await fetchMaybeMemberByOwner(rpc, {
    mutual: input.mutual,
    member: input.member.address,
  });
  if (existing.exists) {
    throw new AlreadyMember(existing.data.tier);
  }

  const ownerAta = await findAssociatedTokenAddress(m.depositMint, input.member.address);
  const balance = await tokenBalanceOrZero(rpc, ownerAta);
  if (balance < tier.contribution) {
    throw new InsufficientBalance(balance, tier.contribution);
  }

  const [memberAccount] = await findJoinMemberAccountPda({
    mutual: input.mutual,
    member: input.member.address,
  });
  const [depositor] = await findDepositorPda({ pool: m.pool, owner: input.member.address });
  const treasury = await findAssociatedTokenAddress(m.depositMint, m.pool);
  // §2.8: join CPIs the member's SAS attestation into existence — the
  // accounts derive from the mutual's stored binding, nothing caller-supplied.
  const [credential] = await findSasCredentialPda({ mutual: input.mutual });
  const [schema] = await findSasSchemaPda({ credential });
  const [attestation] = await findSasAttestationPda({
    credential,
    schema,
    member: input.member.address,
  });

  return [
    // Always prepended: a no-op when the ATA already exists (HANDOFF §2).
    getCreateAssociatedTokenIdempotentInstruction({
      payer: input.member,
      ata: ownerAta,
      owner: input.member.address,
      mint: m.depositMint,
    }),
    await getJoinInstructionAsync({
      member: input.member,
      memberAccount,
      mutual: input.mutual,
      pool: m.pool,
      depositor,
      ownerAta,
      rentPayer: input.member,
      treasury,
      depositMint: m.depositMint,
      credential,
      schema,
      attestation,
      sasProgram: SAS_PROGRAM_ADDRESS,
      tier: input.tier,
    }),
  ];
}

/** getTokenAccountBalance's accountNotFound path: a missing ATA is balance
 * 0n, not an exception (HANDOFF §3). Any other RPC failure rethrows so the
 * page can render its retry state instead of a fake zero. */
export async function tokenBalanceOrZero(rpc: JoinRpc, ata: Address): Promise<bigint> {
  try {
    const { value } = await rpc.getTokenAccountBalance(ata).send();
    return BigInt(value.amount);
  } catch (error) {
    if (isAccountNotFound(error)) {
      return 0n;
    }
    throw error;
  }
}

function isAccountNotFound(error: unknown): boolean {
  if (!isSolanaError(error)) {
    return false;
  }
  const serverMessage = (error.context as { __serverMessage?: string } | undefined)
    ?.__serverMessage;
  return `${serverMessage ?? ""} ${error.message}`.includes("could not find account");
}
