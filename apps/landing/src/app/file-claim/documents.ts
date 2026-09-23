// documents.ts — step 3 intake (CLAIM-WIZARD §4 step 3 / copy doc §
// /app/file-claim step `EVIDENCE`): MIME gate jpeg/png/pdf, the daemon's
// per-document cap (10 MiB — ADR-0031 config), sha256 of the EXACT upload
// bytes via WebCrypto, and HEIC converted client-side BEFORE hashing (the
// hash covers the converted JPEG). File bytes stay in memory only.

import type { DocSlot } from "./draft";

/** Daemon per-document cap (ADR-0031 config: 10 MiB/doc). */
export const MAX_DOC_BYTES = 10 * 1024 * 1024;

/** Accepted MIME types (copy doc: JPEG, PNG, or PDF). */
const ACCEPTED_TYPES: Record<string, true> = {
  "image/jpeg": true,
  "image/png": true,
  "application/pdf": true,
};

/** HEIC/HEIF detection: MIME first, .heic/.heif extension as fallback
 * (browsers report the OS MIME, which is often application/octet-stream). */
function isHeic(file: File): boolean {
  return file.type === "image/heic" || file.type === "image/heif" || /\.hei[cf]$/i.test(file.name);
}

/** sha256(bytes) as lowercase hex — WebCrypto, no dependencies. */
export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes as unknown as ArrayBuffer);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * ponytail: HEIC decode relies on the browser's native decoder
 * (createImageBitmap) — Safari and recent Chromium handle it; a browser that
 * can't gets the honest convert-and-retry error, not a shipped decoder lib
 * (~1 MB). Swap in heic-to if the pilot's support desk sees real volume.
 */
async function convertHeicToJpeg(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92),
    );
    if (blob === null) throw new Error("canvas export failed");
    return blob;
  } catch {
    throw new HeicUnsupported(file.name);
  }
}

/** This browser can't decode HEIC — the member converts the file elsewhere. */
export class HeicUnsupported extends Error {
  constructor(fileName: string) {
    super(`This browser can't convert ${fileName}. Convert it to JPEG and attach that file.`);
    this.name = "HeicUnsupported";
  }
}

export class DocumentRejected extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentRejected";
  }
}

export interface IntakeResult {
  /** The bytes that count — post-conversion when the source was HEIC. */
  bytes: Uint8Array;
  /** sha256 of `bytes` — the manifest leaf hash. */
  sha256: string;
  /** What the wizard should call the stored file (the slot path is canonical). */
  fileName: string;
}

/**
 * Gate + hash one attachment for one canonical slot. Throws DocumentRejected
 * (wrong type / over cap) or HeicUnsupported — both render as honest inline
 * errors, never toasts.
 */
export async function intakeDocument(slot: DocSlot, file: File): Promise<IntakeResult> {
  const effective = isHeic(file) ? await convertHeicToJpeg(file) : file;
  const type = effective.type || file.type;
  if (!ACCEPTED_TYPES[type]) {
    throw new DocumentRejected(
      `${file.name} is not a JPEG, PNG, or PDF — ${slot.label} needs one of those.`,
    );
  }
  const bytes = new Uint8Array(await effective.arrayBuffer());
  if (bytes.length > MAX_DOC_BYTES) {
    throw new DocumentRejected(
      `${file.name} is over 10 MiB. Attach a smaller file or a PDF export.`,
    );
  }
  return { bytes, sha256: await sha256Hex(bytes), fileName: file.name };
}
