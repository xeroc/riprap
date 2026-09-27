// RevealStep.tsx — wizard step 5 REVEAL (ADJUDICATION-DASHBOARD §4/§5,
// copy doc § /app/adjudicate step 5): one click while the reveal window
// runs — the §8 salt bridge holds the preimage in this browser — or the
// downloaded reveal code pasted into the field when it doesn't (the only
// cross-browser path; the paste target fails closed on a code minted for
// another seat). The window gate mirrors the chain: clock time vs the
// window ends + commit count, with the early unlock when every seat has
// committed (spec §2/§4 — never the lagging dispute state field). Back
// free; a revealed vote is the step's completion.
//
// Copy source: copy doc § /app/adjudicate step 5.

import { Button, Input, Label } from "@riprap/ui";
import type { Address } from "@solana/kit";
import { Accord, type Round } from "@useaccord/sdk";
import { useState } from "react";
import { toast } from "sonner";
import { Settle } from "../components/Settle";
import { formatUtc } from "../pool/mutual";
import { useHanseEnv } from "../shared/rpc";
import { describeError, sendInstruction } from "../shared/transaction";
import { loadStoredVote, parseRevealCode, revealOpen, saltBridgeKey } from "./vote";

/** The send phases (copy doc: verbatim with the wizard's SIGN). */
const SEND_PHASE_LINES = {
  building: "Building the transaction…",
  "wallet-signing": "Waiting for your wallet…",
  confirming: "Confirming…",
} as const;

type SendPhase = keyof typeof SEND_PHASE_LINES;

/**
 * The step body. The session shell supplies the seat, the live Round read
 * (window ends + counts), the chain's `revealed` read for this seat, and
 * the current clock second (the shell runs the 1s tick only while a
 * window is live — spec §2). Back free; Continue advances once revealed.
 */
export function RevealStep({
  subaccord,
  dispute,
  roundAddress,
  roundIdx,
  wallet,
  round,
  nowSec,
  hasRevealed,
  onBack,
  onDone,
}: {
  subaccord: Address;
  dispute: Address;
  roundAddress: Address;
  roundIdx: number;
  wallet: Address;
  round: Round;
  nowSec: bigint;
  hasRevealed: boolean;
  onBack: () => void;
  onDone: () => void;
}) {
  const env = useHanseEnv();
  const [phase, setPhase] = useState<SendPhase | null>(null);
  const [codeText, setCodeText] = useState("");
  const [revealed, setRevealed] = useState(false);
  const done = hasRevealed || revealed;
  const open = revealOpen(
    { commitEnd: round.commitEnd, revealEnd: round.revealEnd },
    { commitCount: round.commitCount, jurorCount: round.jurorCount },
    nowSec,
  );
  const bridge = loadStoredVote(saltBridgeKey(dispute, roundIdx, wallet));

  const send = async (vote: bigint, salt: Uint8Array) => {
    if (env === null) return;
    setPhase("building");
    try {
      const accord = new Accord({ endpoint: env.endpoint, signer: env.signer });
      const instruction = accord.methods.reveal(
        { signer: wallet, subaccord, dispute, round: roundAddress },
        { vote, salt },
      );
      setPhase("wallet-signing");
      await sendInstruction(env.rpc, env.rpcSubscriptions, env.signer, [instruction], () =>
        setPhase("confirming"),
      );
      setRevealed(true);
    } catch (err) {
      toast.error(describeError(err));
    } finally {
      setPhase(null);
    }
  };

  const revealFromCode = () => {
    const code = parseRevealCode(codeText);
    if (code === null || code.dispute !== dispute || code.round !== roundIdx) {
      toast.error("This reveal code doesn't match this seat.");
      return;
    }
    void send(BigInt(code.choice), code.salt);
  };

  const busy = phase !== null;

  return (
    <Settle className="flex max-w-3xl flex-col gap-(--riprap-space-lg)">
      {!open ? (
        <p data-num className="font-mono text-sm text-muted-foreground">
          The reveal window opens {formatUtc(round.revealEnd)}.
        </p>
      ) : done ? (
        <p className="text-ink [font:var(--riprap-body-md)]" data-slot="revealed">
          Vote revealed.
        </p>
      ) : bridge !== null ? (
        <Button
          className="w-44"
          disabled={busy}
          onClick={() => void send(bridge.vote, bridge.salt)}
        >
          Reveal vote
        </Button>
      ) : (
        <div className="flex max-w-xl flex-col gap-3" data-slot="reveal-code-entry">
          <Label htmlFor="reveal-code">Reveal code</Label>
          <Input
            id="reveal-code"
            value={codeText}
            disabled={busy}
            onChange={(e) => setCodeText(e.target.value)}
          />
          <div>
            <Button className="w-24" disabled={busy || codeText === ""} onClick={revealFromCode}>
              Reveal
            </Button>
          </div>
        </div>
      )}
      {phase !== null && (
        <p data-num className="font-mono text-sm text-muted-foreground">
          {SEND_PHASE_LINES[phase]}
        </p>
      )}
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        {done && <Button onClick={onDone}>Continue</Button>}
      </div>
    </Settle>
  );
}
