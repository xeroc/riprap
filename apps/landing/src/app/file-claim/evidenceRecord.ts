// evidenceRecord.ts — the wizard/recovery delivery record: which canonical
// documents this browser successfully delivered per claim. The daemon's
// derived completeness is juror-gated (ADR-0031 — no public per-file
// listing), so the member surface shows the local record: all five paths
// recorded ⇒ `Evidence: complete`. Unknown (CLI-filed, another browser) ⇒
// honestly incomplete — recovery re-delivery is idempotent either way, and
// the record is written by both the wizard and the recovery flow.

const DELIVERED_PATHS = [
  "01-ticket.pdf",
  "02-id-document.jpg",
  "03-police-report.pdf",
  "04-medical-report.pdf",
  "05-statutory-declaration.pdf",
] as const;

function key(mutual: string, nonce: bigint): string {
  return `riprap:evidence:${mutual}:${nonce.toString()}`;
}

/** Record a complete delivery (all five paths) for one claim. */
export function recordDelivery(mutual: string, nonce: bigint): void {
  try {
    localStorage.setItem(
      key(mutual, nonce),
      JSON.stringify({ delivered: DELIVERED_PATHS, at: Date.now() }),
    );
  } catch {
    // storage quota — the recovery flow re-delivers idempotently anyway
  }
}

/** The local record says all five documents reached the operator. */
export function deliveryComplete(mutual: string, nonce: bigint): boolean {
  try {
    const raw = localStorage.getItem(key(mutual, nonce));
    if (raw === null) return false;
    const parsed = JSON.parse(raw) as { delivered?: string[] };
    return DELIVERED_PATHS.every((path) => parsed.delivered?.includes(path));
  } catch {
    return false;
  }
}
