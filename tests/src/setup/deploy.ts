// deploy.ts — deploy a .so via BPF Upgradeable Loader transactions.
//
// `anchor test` deploys the workspace programs (pool, hanse) itself; accord.so
// lives in the sibling checkout, so the harness deploys it here in beforeAll:
// create buffer + InitializeBuffer → 1 KiB Writes → create program account +
// DeployWithMaxDataLen (each CreateAccount MUST share a tx with its loader
// instruction, per the loader contract — hence env.sendIxs).
//
// Instruction encodings verified against solana-bpf-loader-program 3.1.14:
// bincode fixint — u32 LE enum tag, u32 Write offset, u64 Vec length and
// usize max_data_len. Account layouts: buffer = 37 B metadata + elf,
// programdata = 45 B metadata + elf (PDA [program] / loader), program = 36 B.

import { readFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import {
  AccountRole,
  type Address,
  createKeyPairSignerFromBytes,
  generateKeyPairSigner,
  getAddressEncoder,
  getProgramDerivedAddress,
  type Instruction,
  type KeyPairSigner,
  lamports,
} from "@solana/kit";
import { ACCORD_PROGRAM_ID } from "@useaccord/sdk";
import type { TestEnv } from "./env.js";

/** BPFLoaderUpgradeab1e — the upgradeable loader program. */
const LOADER_ADDRESS = "BPFLoaderUpgradeab1e11111111111111111111111" as Address;
const RENT_SYSVAR = "SysvarRent111111111111111111111111111111111" as Address;
const CLOCK_SYSVAR = "SysvarC1ock11111111111111111111111111111111" as Address;
const SYSTEM_PROGRAM_ADDRESS = "11111111111111111111111111111111" as Address;

/** UpgradeableLoaderState::size_of_buffer_metadata() / _programdata_metadata() / _program(). */
const BUFFER_META_LEN = 37;
const PROGRAMDATA_META_LEN = 45;
const PROGRAM_LEN = 36;
/** Bytes per Write tx — fits the 1232-B serialized-tx budget with overhead. */
const WRITE_CHUNK = 1000;
/** Concurrent fire-and-forget writes per batch (blockhash refreshed per batch). */
const WRITE_BATCH = 64;

/**
 * Typed failure for a missing sibling build: the fix is outside this repo, so
 * it gets its own class the specs can assert on (and a message that names it).
 */
export class MissingAccordBuildError extends Error {
  readonly soPath: string;

  constructor(soPath: string, cause?: unknown) {
    super(
      `accord.so not found at ${soPath}. Build the sibling checkout: ` +
      "`cd ../accord && make build` (produces target/deploy/accord.so), " +
      "or point ACCORD_SO at an existing artifact.",
    );
    this.name = "MissingAccordBuildError";
    this.soPath = soPath;
    this.cause = cause;
  }
}

/** bincode fixint LE integers — the loader's wire format. */
function encodeLe(values: Array<[value: number | bigint, bytes: 4 | 8]>): Uint8Array {
  const total = values.reduce((sum, [, size]) => sum + size, 0);
  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  let offset = 0;
  for (const [value, size] of values) {
    if (size === 4) {
      view.setUint32(offset, Number(value), true);
    } else {
      view.setBigUint64(offset, BigInt(value), true);
    }
    offset += size;
  }
  return out;
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

type Meta = {
  address: Address;
  role: AccountRole;
  signer?: KeyPairSigner;
};

function rawInstruction(programAddress: Address, accounts: Meta[], data: Uint8Array): Instruction {
  // Plain metas stay { address, role }; metas carrying `signer` satisfy kit's
  // AccountSignerMeta shape so signTransactionMessageWithSigners collects them.
  return { accounts, data, programAddress } as Instruction;
}

/**
 * System CreateAccount: tag 0 ‖ lamports u64 ‖ space u64 ‖ owner 32 B. The
 * system program requires the new account itself to sign when it allocates
 * data ("Allocate: 'to' account must sign") — pass `newAccountSigner`.
 */
function createAccountIx(params: {
  payer: Address;
  newAccount: Address;
  owner: Address;
  lamports: bigint;
  space: number | bigint;
  newAccountSigner?: KeyPairSigner;
}): Instruction {
  const data = concat(
    encodeLe([[0, 4]]),
    encodeLe([[params.lamports, 8]]),
    encodeLe([[params.space, 8]]),
    new Uint8Array(getAddressEncoder().encode(params.owner)),
  );
  return rawInstruction(
    SYSTEM_PROGRAM_ADDRESS,
    [
      { address: params.payer, role: AccountRole.WRITABLE_SIGNER },
      {
        address: params.newAccount,
        role: AccountRole.WRITABLE_SIGNER,
        signer: params.newAccountSigner,
      },
    ],
    data,
  );
}

/** InitializeBuffer (loader tag 0): [buffer w, authority r]. */
function initializeBufferIx(buffer: Address, authority: Address): Instruction {
  return rawInstruction(
    LOADER_ADDRESS,
    [
      { address: buffer, role: AccountRole.WRITABLE },
      { address: authority, role: AccountRole.READONLY },
    ],
    encodeLe([[0, 4]]),
  );
}

/** Write (loader tag 1): tag ‖ offset u32 ‖ len u64 ‖ bytes; [buffer w, authority s]. */
function writeIx(
  buffer: Address,
  authority: Address,
  offset: number,
  bytes: Uint8Array,
): Instruction {
  const data = concat(
    encodeLe([[1, 4]]),
    encodeLe([[offset, 4]]),
    encodeLe([[bytes.length, 8]]),
    bytes,
  );
  return rawInstruction(
    LOADER_ADDRESS,
    [
      { address: buffer, role: AccountRole.WRITABLE },
      { address: authority, role: AccountRole.READONLY_SIGNER },
    ],
    data,
  );
}

/** DeployWithMaxDataLen (loader tag 2): tag ‖ max_data_len u64; 8 accounts. */
function deployWithMaxDataLenIx(params: {
  payer: Address;
  programData: Address;
  program: Address;
  buffer: Address;
  maxDataLen: number;
}): Instruction {
  return rawInstruction(
    LOADER_ADDRESS,
    [
      { address: params.payer, role: AccountRole.WRITABLE_SIGNER },
      { address: params.programData, role: AccountRole.WRITABLE },
      { address: params.program, role: AccountRole.WRITABLE },
      { address: params.buffer, role: AccountRole.WRITABLE },
      { address: RENT_SYSVAR, role: AccountRole.READONLY },
      { address: CLOCK_SYSVAR, role: AccountRole.READONLY },
      { address: SYSTEM_PROGRAM_ADDRESS, role: AccountRole.READONLY },
      { address: params.payer, role: AccountRole.READONLY_SIGNER }, // authority
    ],
    concat(encodeLe([[2, 4]]), encodeLe([[params.maxDataLen, 8]])),
  );
}

/**
 * Deploy `elf` to `programId` over the upgradeable loader. `programSigner` is
 * the keypair of the program id itself (anchor writes `<name>-keypair.json`
 * beside the .so) — creating the 36-B program account requires its signature.
 * The buffer's rent drains back to the payer inside Deploy, so the payer needs
 * (and is funded for) buffer + programdata + program rent plus fees up front.
 */
export async function deployProgram(
  env: TestEnv,
  programId: Address,
  elf: Uint8Array,
  programSigner: KeyPairSigner,
): Promise<void> {
  const buffer = await generateKeyPairSigner();
  const [programData] = await getProgramDerivedAddress({
    programAddress: LOADER_ADDRESS,
    seeds: [new Uint8Array(getAddressEncoder().encode(programId))],
  });

  const bufferSpace = BUFFER_META_LEN + elf.length;
  const programDataSpace = PROGRAMDATA_META_LEN + elf.length;
  const [bufferRent, programDataRent, programRent] = await Promise.all([
    env.rpc.getMinimumBalanceForRentExemption(BigInt(bufferSpace)).send(),
    env.rpc.getMinimumBalanceForRentExemption(BigInt(programDataSpace)).send(),
    env.rpc.getMinimumBalanceForRentExemption(BigInt(PROGRAM_LEN)).send(),
  ]);

  // Rent minimums arrive as bare JSON numbers; balance wraps in { value } —
  // coerce both before bigint arithmetic.
  const bufferRentLamports = BigInt(bufferRent);
  const programDataRentLamports = BigInt(programDataRent);
  const programRentLamports = BigInt(programRent);
  const fees = BigInt(Math.ceil(elf.length / WRITE_CHUNK) + 2) * 5_000n;
  const needed = bufferRentLamports + programDataRentLamports + programRentLamports + fees + 1n;
  const balance = await env.rpc.getBalance(env.payer.address).send();
  if (BigInt(balance.value) < needed) {
    await env.rpc
      .requestAirdrop(env.payer.address, lamports(needed - BigInt(balance.value)))
      .send();
  }
  await env.sendIxs([
    createAccountIx({
      payer: env.payer.address,
      newAccount: buffer.address,
      owner: LOADER_ADDRESS,
      lamports: bufferRentLamports,
      space: bufferSpace,
      newAccountSigner: buffer,
    }),
    initializeBufferIx(buffer.address, env.payer.address),
  ]);

  // Writes land at independent offsets, so batches fire concurrently sharing
  // one blockhash (refreshed per batch against expiry), skip per-tx confirm,
  // and are verified by the buffer-length poll below plus Deploy's ELF check.
  for (let batchStart = 0; batchStart < elf.length; batchStart += WRITE_CHUNK * WRITE_BATCH) {
    const batchEnd = Math.min(batchStart + WRITE_CHUNK * WRITE_BATCH, elf.length);
    const lifetime = (await env.rpc.getLatestBlockhash().send()).value;
    const offsets: number[] = [];
    for (let o = batchStart; o < batchEnd; o += WRITE_CHUNK) offsets.push(o);
    await Promise.all(
      offsets.map((offset) => {
        const chunk = elf.subarray(offset, Math.min(offset + WRITE_CHUNK, elf.length));
        return env.sendIxs([writeIx(buffer.address, env.payer.address, offset, chunk)], {
          blockhash: lifetime,
          skipConfirm: true,
        });
      }),
    );
    // console.error(`[deploy] ${programId}: wrote ${batchEnd}/${elf.length} B`);
  }

  // Confirm out-of-band: the buffer reaches full size once every write lands.
  for (let poll = 0; poll < 100; poll++) {
    const account = await env.rpc.getAccountInfo(buffer.address, { encoding: "base64" }).send();
    const size = account.value ? Buffer.from(account.value.data[0], "base64").length : 0;
    if (size >= bufferSpace) break;
    await sleep(200);
  }

  await env.sendIxs([
    createAccountIx({
      payer: env.payer.address,
      newAccount: programId,
      owner: LOADER_ADDRESS,
      lamports: programRentLamports,
      space: PROGRAM_LEN,
      newAccountSigner: programSigner,
    }),
    deployWithMaxDataLenIx({
      payer: env.payer.address,
      programData,
      program: programId,
      buffer: buffer.address,
      maxDataLen: elf.length,
    }),
  ]);
}

/**
 * Idempotently ensure the accord program exists on the surfnet: skip when
 * already deployed (reused Surfnet / anchor-test rerun), otherwise deploy the
 * sibling build via loader transactions. Paths come from ACCORD_SO /
 * ACCORD_KEYPAIR, defaulting into the sibling checkout next to this worktree
 * (…/Accord/accord/target/deploy/ — resolved from this module so they hold
 * regardless of jest's cwd).
 */
export async function ensureAccordProgram(env: TestEnv): Promise<{
  programId: Address;
  /** `true` when this call wrote the program; `false` when it already existed. */
  deployed: boolean;
}> {
  const existing = await env.rpc.getAccountInfo(ACCORD_PROGRAM_ID).send();
  if (existing.value !== null) {
    return { programId: ACCORD_PROGRAM_ID, deployed: false };
  }

  const soPath =
    process.env.ACCORD_SO ??
    fileURLToPath(new URL("../../../../accord/target/deploy/accord.so", import.meta.url));
  const keypairPath =
    process.env.ACCORD_KEYPAIR ??
    fileURLToPath(new URL("../../../../accord/target/deploy/accord-keypair.json", import.meta.url));

  let elf: Uint8Array;
  let programSigner: KeyPairSigner;
  try {
    elf = new Uint8Array(readFileSync(soPath));
    // Creating the program account at the canonical id needs the id's keypair
    // (system Allocate rule) — anchor writes it beside the .so.
    programSigner = await createKeyPairSignerFromBytes(
      new Uint8Array(JSON.parse(readFileSync(keypairPath, "utf-8"))),
    );
  } catch (e) {
    throw new MissingAccordBuildError(soPath, e);
  }
  if (programSigner.address !== ACCORD_PROGRAM_ID) {
    throw new Error(
      `accord-keypair.json at ${keypairPath} derives ${programSigner.address}, ` +
      `but @useaccord/sdk pins ${ACCORD_PROGRAM_ID} — rebuild the sibling checkout.`,
    );
  }

  // console.error(`[deploy] accord.so ${elf.length} B from ${soPath}`);
  await deployProgram(env, ACCORD_PROGRAM_ID, elf, programSigner);
  return { programId: ACCORD_PROGRAM_ID, deployed: true };
}
