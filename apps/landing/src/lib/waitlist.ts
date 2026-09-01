export interface WaitlistResult {
  ok: boolean;
  message: string;
  /** true only on success — the caller resets the form. */
  reset: boolean;
}

export async function submitWaitlist(
  endpoint: string,
  email: string,
  fetchImpl: typeof fetch,
): Promise<WaitlistResult> {
  if (!endpoint) {
    return { ok: false, message: "Waitlist not wired yet. Ping us on X.", reset: false };
  }
  try {
    const res = await fetchImpl(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, type: "waitlist", timestamp: new Date().toISOString() }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { ok: true, message: "On the list. One email when the first pool opens.", reset: true };
  } catch {
    return {
      ok: false,
      message: "Couldn't reach the list. Try again, or ping us on X.",
      reset: false,
    };
  }
}
