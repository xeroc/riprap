// CommitStep.tsx — wizard step 4 COMMIT (ADJUDICATION-DASHBOARD §4/§8,
// copy doc § /app/adjudicate step 4): the verdict is sealed with a locally
// generated 32-byte salt and sent hidden (accord::commit —
// `sha256(vote_le ‖ salt ‖ juror)`; the choice index rides VerdictStep's
// hanse-opt/v1 recipe). The preimage persists in the §8 salt bridge keyed
// (dispute, round, juror) — saved when the commitment is sent, the accord
// convention — and ships as the downloadable mono reveal code, the only
// cross-browser reveal path. Back free; a sent commitment is the step's
// completion.
//
// Copy source: copy doc § /app/adjudicate step 4 (intro, send phases,
// committed lines, reveal-code block).

import { Button } from "@riprap/ui";
import type { Address } from "@solana/kit";
import { Accord } from "@useaccord/sdk";
import { useState } from "react";
import { toast } from "sonner";

import { Settle } from "../components/Settle";
import { formatUtc } from "../pool/mutual";
import { useHanseEnv } from "../shared/rpc";
import { describeError, sendInstruction } from "../shared/transaction";
import type { VerdictChoice } from "./VerdictStep";
import {
  encodeRevealCode,
  loadStoredVote,
  randomSalt,
  saltBridgeKey,
  saveStoredVote,
} from "./vote";

/** The send phases (copy doc: verbatim with the wizard's SIGN). */
const SEND_PHASE_LINES = {
  building: "Building the transaction…",
  "wallet-signing": "Waiting for your wallet…",
  confirming: "Confirming…",
} as const;

type SendPhase = keyof typeof SEND_PHASE_LINES;

/** Synchronous download — must ride a user gesture (the manifest pattern). */
function downloadRevealCode(dispute: Address, roundIdx: number, code: string): void {
  const blob = new Blob([code], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `reveal-code-${dispute.slice(0, 8)}-r${roundIdx}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * The step body. The session shell supplies the seat (subaccord, dispute,
 * round PDA + index, wallet), the chosen option index from step 3, the
 * round's reveal window end, and the chain's `committed` read; the salt,
 * the bridge, the reveal code, and the send are this step's.
 */
export function CommitStep({
  subaccord,
  dispute,
  roundAddress,
  roundIdx,
  wallet,
  choice,
  revealEnd,
  hasCommitted,
  onBack,
  onDone,
}: {
  subaccord: Address;
  dispute: Address;
  roundAddress: Address;
  roundIdx: number;
  wallet: Address;
  choice: VerdictChoice;
  revealEnd: bigint;
  hasCommitted: boolean;
  onBack: () => void;
  onDone: () => void;
}) {
  const env = useHanseEnv();
  const bridgeKey = saltBridgeKey(dispute, roundIdx, wallet);
  const [phase, setPhase] = useState<SendPhase | null>(null);
  const [sent, setSent] = useState(false);
  const committed = hasCommitted || sent;
  const bridge = loadStoredVote(bridgeKey);

  const submit = async () => {
    if (env === null) return;
    setPhase("building");
    try {
      // Reuse a bridge that already carries this choice (an idempotent
      // re-commit); otherwise fresh local salt.
      const stored = loadStoredVote(bridgeKey);
      const salt = stored?.vote === BigInt(choice) ? stored.salt : randomSalt();
      // Bridge saved when the commitment is sent (the accord convention):
      // a crash between confirmation and UI update still reveals.
      saveStoredVote(bridgeKey, BigInt(choice), salt);
      const accord = new Accord({ endpoint: env.endpoint, signer: env.signer });
      const { instruction } = await accord.methods.commit(
        { signer: wallet, subaccord, dispute, round: roundAddress },
        { vote: BigInt(choice), salt },
      );
      setPhase("wallet-signing");
      await sendInstruction(env.rpc, env.rpcSubscriptions, env.signer, [instruction], () =>
        setPhase("confirming"),
      );
      setSent(true);
    } catch (err) {
      toast.error(describeError(err));
    } finally {
      setPhase(null);
    }
  };

  const busy = phase !== null;
  const code =
    bridge !== null && bridge.vote === BigInt(choice)
      ? encodeRevealCode({ dispute, round: roundIdx, choice, salt: bridge.salt })
      : null;

  return (
    <Settle className="flex max-w-3xl flex-col gap-(--riprap-space-lg)">
      <p className="max-w-xl leading-relaxed text-muted-foreground [font:var(--riprap-body-sm)]">
        Your vote is sealed with a random salt and sent hidden. It counts only after you reveal it.
      </p>
      {committed ? (
        <div className="flex max-w-xl flex-col gap-3" data-slot="committed">
          <p className="text-ink [font:var(--riprap-body-md)]">Vote committed.</p>
          <p data-num className="font-mono text-sm text-muted-foreground">
            The reveal window opens {formatUtc(revealEnd)}.
          </p>
          {code !== null && (
            <div className="flex flex-col gap-3" data-slot="reveal-code">
              <p
                data-num
                className="max-w-xl break-all border border-hairline bg-card p-4 font-mono text-xs leading-relaxed text-body"
              >
                {code}
              </p>
              <div>
                <Button
                  variant="outline"
                  onClick={() => downloadRevealCode(dispute, roundIdx, code)}
                >
                  Download reveal code
                </Button>
              </div>
              <p className="leading-relaxed text-muted-foreground [font:var(--riprap-body-sm)]">
                Keep this code. It's the only way to reveal from another browser — without it, a
                committed vote cannot be revealed.
              </p>
            </div>
          )}
        </div>
      ) : (
        phase !== null && (
          <p data-num className="font-mono text-sm text-muted-foreground">
            {SEND_PHASE_LINES[phase]}
          </p>
        )
      )}
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        {committed ? (
          <Button onClick={onDone}>Continue</Button>
        ) : (
          <Button disabled={busy} onClick={() => void submit()}>
            Commit vote
          </Button>
        )}
      </div>
    </Settle>
  );
}
