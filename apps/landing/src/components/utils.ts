// tiny className joiner — avoids pulling @riprap/ui internals beyond the
// public barrel
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
