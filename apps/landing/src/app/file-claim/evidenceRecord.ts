// evidenceRecord.ts — the wizard/recovery delivery record: which canonical
// slots this browser successfully delivered per claim (file slots PUT to the
// operator, url slots inside the posted manifest). The daemon's derived
// completeness is juror-gated (ADR-0031 — no public per-file listing), so
// the member surface shows the local record: the claim's full slot set
// recorded ⇒ `Evidence: complete`. Unknown (CLI-filed, another browser) ⇒
// honestly incomplete — recovery re-delivery is idempotent either way, and
// the record is written by both the wizard and the recovery flow.

function key(mutual: string, nonce: bigint): string {
  return `riprap:evidence:${mutual}:${nonce.toString()}`;
}

/** Record a complete delivery for one claim — the pool's full slot paths
 *  (its flow pack's documentSlots), files and url slots alike. Written only
 *  once every slot is delivered, so the record's presence is completeness. */
export function recordDelivery(mutual: string, nonce: bigint, paths: readonly string[]): void {
  try {
    localStorage.setItem(key(mutual, nonce), JSON.stringify({ delivered: paths, at: Date.now() }));
  } catch {
    // storage quota — the recovery flow re-delivers idempotently anyway
  }
}

/** The local record says every slot of this claim reached the operator. */
export function deliveryComplete(mutual: string, nonce: bigint): boolean {
  try {
    const raw = localStorage.getItem(key(mutual, nonce));
    if (raw === null) return false;
    const parsed = JSON.parse(raw) as { delivered?: string[] };
    return (parsed.delivered?.length ?? 0) > 0;
  } catch {
    return false;
  }
}
