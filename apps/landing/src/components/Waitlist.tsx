import { Button, Input } from "@riprap/ui";
import { type FormEvent, useState } from "react";

import { submitWaitlist } from "../lib/waitlist";

// Waitlist form — POSTs { email, type, timestamp } to VITE_N8N_WEBHOOK_URL
// (n8n webhook). Same contract as chainsquad.com and the Accord landing.
// Anti-hype microcopy; submit logic lives in ../lib/waitlist (testable seam).
const endpoint = import.meta.env.VITE_N8N_WEBHOOK_URL ?? "";

export function Waitlist() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ msg: string; ok: boolean }>({ msg: "", ok: false });

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || sending) return;
    setSending(true);
    setStatus({ msg: "Sending…", ok: true });
    const res = await submitWaitlist(endpoint, value, fetch);
    setStatus({ msg: res.message, ok: res.ok });
    if (res.reset) setEmail("");
    setSending(false);
  };

  return (
    <form
      data-waitlist
      className="flex w-full max-w-md flex-col gap-2"
      noValidate
      onSubmit={onSubmit}
    >
      <div className="flex w-full flex-col gap-2 sm:flex-row">
        <Input
          type="email"
          name="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="you@riprap.xyz"
          aria-label="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full flex-1 font-mono"
        />
        <Button type="submit" disabled={sending} className="shrink-0">
          Count me in
        </Button>
      </div>
      <p
        data-waitlist-status
        role="status"
        aria-live="polite"
        className={`w-full text-left font-mono text-xs ${
          status.msg ? (status.ok ? "text-stone" : "text-error") : "text-muted-foreground"
        }`}
      >
        {status.msg}
      </p>
    </form>
  );
}
