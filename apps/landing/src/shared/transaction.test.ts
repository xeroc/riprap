// Pins the send contract of sendInstruction: simulate → broadcast
// (sendTransaction) → confirm — and never broadcast past a failed simulation.
// Ported from the accord dApp; extended for the generalized Instruction[]
// bundle (join sends [ATA-create, hanse::join] as one signature).

import {
  type Address,
  generateKeyPairSigner,
  type Instruction,
  type Rpc,
  type RpcSubscriptions,
  type SolanaRpcApi,
  type SolanaRpcSubscriptionsApi,
} from "@solana/kit";
import { describe, expect, it } from "vitest";

import { describeError, sendInstruction, TransactionSendError } from "./transaction";

/** Async iterable that never yields — a subscription with no notifications. */
function pendingNotifications(): AsyncIterable<never> {
  return {
    [Symbol.asyncIterator]: () => ({
      next: () => new Promise<never>(() => {}),
    }),
  };
}

function mockRpc(calls: string[], simulation: { err: unknown; logs?: string[] }) {
  return {
    getLatestBlockhash: () => ({
      send: async () => ({
        value: { blockhash: "1".repeat(32), lastValidBlockHeight: 1000n },
      }),
    }),
    simulateTransaction: () => {
      calls.push("simulate");
      return {
        send: async () => ({
          value: { err: simulation.err, logs: simulation.logs ?? [] },
        }),
      };
    },
    sendTransaction: () => {
      calls.push("send");
      return { send: async () => "sig".repeat(20) };
    },
    getSignatureStatuses: () => ({
      send: async () => ({
        value: [{ slot: 1, err: null, confirmationStatus: "confirmed" }],
      }),
    }),
    getEpochInfo: () => ({
      send: async () => ({ absoluteSlot: 1n, blockHeight: 1n }),
    }),
  } as unknown as Rpc<SolanaRpcApi>;
}

const rpcSubscriptions = {
  signatureNotifications: () => ({
    subscribe: async () => pendingNotifications(),
  }),
  slotNotifications: () => ({
    subscribe: async () => pendingNotifications(),
  }),
} as unknown as RpcSubscriptions<SolanaRpcSubscriptionsApi>;

const instruction = {
  programAddress: "1".repeat(32) as Address,
  accounts: [],
  data: new Uint8Array(),
} as Instruction;

describe("sendInstruction", () => {
  it("broadcasts a multi-instruction bundle via sendTransaction after a clean simulation", async () => {
    const calls: string[] = [];
    const signer = await generateKeyPairSigner();

    const returned = await sendInstruction(
      mockRpc(calls, { err: null }),
      rpcSubscriptions,
      signer,
      [instruction, instruction], // the bundle path — join sends two
    );

    expect(calls).toEqual(["simulate", "send"]);
    expect(returned).toBeTruthy();
  });

  it("throws TransactionSendError and never broadcasts on a failed simulation", async () => {
    const calls: string[] = [];
    const signer = await generateKeyPairSigner();

    await expect(
      sendInstruction(
        mockRpc(calls, { err: "InstructionFallbackNotFound", logs: ["Program log: boom"] }),
        {} as unknown as RpcSubscriptions<SolanaRpcSubscriptionsApi>,
        signer,
        [instruction],
      ),
    ).rejects.toThrow(/simulation failed/);
    expect(calls).toEqual(["simulate"]);
  });
});

describe("describeError — the toast map", () => {
  it("extracts the Anchor error code + message from simulation logs", () => {
    const err = new TransactionSendError(
      "verbose",
      [
        "Program log: Instruction: Join",
        "Program log: AnchorError occurred. Error Code: DepositsClosed. Error Number: 6002. Error Message: The deposits window is closed.",
      ],
      "InstructionError",
    );
    expect(describeError(err)).toBe("DepositsClosed: The deposits window is closed");
  });

  it("falls back to the last program log line, then the simulation error", () => {
    const lastLog = new TransactionSendError("verbose", ["Program log: something failed."], "x");
    expect(describeError(lastLog)).toBe("something failed");
    const noLogs = new TransactionSendError("verbose", [], "BlockhashNotFound");
    expect(describeError(noLogs)).toBe("Transaction failed: BlockhashNotFound");
  });

  it("unwraps wallet cause chains to the root message", () => {
    const root = new Error("User rejected the request.");
    const wrapped = new Error("Failed to sign", { cause: root });
    expect(describeError(wrapped)).toBe("User rejected the request.");
  });
});
