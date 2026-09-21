// /2026-breakpoint-blade-pool — the anchored cover terms: the exact bytes the
// mutual's policy_hash pins, fetched from the Accord evidence daemon's public
// domain CAS and rendered verbatim (no markdown interpretation — what's
// anchored is what's shown). 404 is a state with a remedy: the operator
// uploads the cover-terms file through the daemon's proof-mode PUT
// (HANSE_DOMAIN_SPEC_UPLOAD §2) — the client hashes the file, refuses any
// bytes that don't match the on-chain policy_hash, derives the preimage, and
// PUTs. Copy: landing-page.md § "Anchored terms band" (2026-09-21).

import type { Mutual } from "@riprap/hanse";
import { Button, Card, SectionBand } from "@riprap/ui";
import { type ChangeEvent, useRef, useState } from "react";
import { domainRefHex, hansePreimage, sha256Hex, toHex } from "../domainRef";
import { useMutual } from "../useMutual";
import { evidenceBaseUrl, usePolicyDoc } from "../usePolicyDoc";

// Kit data law: unknown values render as mono {{PARAM}} placeholders.
const PARAM = "{{PARAM}}";

/** PUT failure → one deadpan line (copy doc). */
function putFailureLine(status: number): string {
  if (status === 404) return "The evidence server can't see the mutual yet. Try again in a moment.";
  if (status === 400)
    return "The evidence server rejected the proof — these bytes don't match the on-chain anchor.";
  if (status === 409) return "Different bytes are already stored at this anchor.";
  return "The upload didn't go through. Try again.";
}

/** Proof-mode PUT per HANSE_DOMAIN_SPEC_UPLOAD §2 — hash checked BEFORE any PUT. */
async function uploadTerms(
  base: string,
  mutual: Mutual,
  file: File,
): Promise<{ ok: true } | { ok: false; line: string }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if ((await sha256Hex(bytes)) !== toHex(mutual.policyHash)) {
    return {
      ok: false,
      line: "This file's hash doesn't match the mutual's policy hash. Nothing was uploaded.",
    };
  }
  const ref = await domainRefHex(mutual.seed, mutual.policyHash);
  const preimage = toHex(hansePreimage(mutual.seed, mutual.policyHash));
  const query = `?subaccord=${encodeURIComponent(mutual.subaccord)}&preimage=${preimage}&offset=23`;
  const response = await fetch(`${base}/domains/${ref}${query}`, {
    method: "PUT",
    headers: { "Content-Type": "text/markdown" },
    body: bytes,
  });
  if (response.status === 201 || response.status === 200) return { ok: true };
  return { ok: false, line: putFailureLine(response.status) };
}

export function AnchoredTerms() {
  const mutualQuery = useMutual();
  const mutual = mutualQuery.state === "ready" ? mutualQuery.mutual : null;
  const doc = usePolicyDoc(mutual);

  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onPick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // same file re-picked must re-fire onChange
    if (file === undefined || mutual === null) return;
    setUploading(true);
    setUploadError(null);
    try {
      const result = await uploadTerms(evidenceBaseUrl(), mutual, file);
      if (result.ok) {
        await doc.refetch();
      } else {
        setUploadError(result.line);
      }
    } catch {
      setUploadError("The upload didn't go through. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <SectionBand id="terms" label="the anchored terms" tone="soft">
      <div className="flex flex-col gap-(--riprap-space-lg)">
        <h2 className="tracking-(--riprap-tracking-display) text-ink [font:var(--riprap-display-sm)]">
          The terms as anchored on-chain.
        </h2>
        <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
          The exact bytes the mutual's policy hash pins, served by the Accord evidence server.
          Rendered verbatim.
        </p>
        <Card data-slot="terms-card" className="gap-3 p-6">
          {doc.state === "idle" && (
            <p data-num className="font-mono text-sm text-ink">
              terms: {PARAM}
            </p>
          )}
          {doc.state === "loading" && (
            <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
              Reading the terms from the evidence server.
            </p>
          )}
          {doc.state === "error" && (
            <div className="flex flex-col gap-3">
              <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
                Couldn't reach the evidence server.
              </p>
              <Button variant="outline" onClick={doc.retry}>
                Try again
              </Button>
            </div>
          )}
          {doc.state === "missing" && mutual !== null && (
            <div className="flex flex-col gap-3">
              <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
                Not published yet.
              </p>
              <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
                The cover terms aren't on the evidence server. Upload the file whose hash the mutual
                pins.
              </p>
              <input
                ref={fileInput}
                type="file"
                accept=".md,.markdown,text/markdown"
                className="hidden"
                onChange={(e) => void onPick(e)}
                aria-label="cover terms file"
              />
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  disabled={uploading}
                  onClick={() => fileInput.current?.click()}
                >
                  {uploading ? "Uploading…" : "Upload the cover terms"}
                </Button>
                {uploadError !== null && (
                  <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
                    {uploadError}
                  </p>
                )}
              </div>
            </div>
          )}
          {doc.state === "ready" && mutual !== null && (
            <div className="flex flex-col gap-4">
              <p data-num className="font-mono text-xs text-stone">
                POLICY HASH {toHex(mutual.policyHash)} · DOMAIN REF {doc.ref}
              </p>
              <pre className="overflow-x-auto whitespace-pre-wrap text-ink [font:var(--riprap-body-sm)]">
                {doc.text}
              </pre>
            </div>
          )}
        </Card>
      </div>
    </SectionBand>
  );
}
