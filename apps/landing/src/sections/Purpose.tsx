// §1.3 — PURPOSE (added 2026-10-20 purpose-pool pass, copy doc §1.3): the
// band that states what a pool is — member money bound to one purpose, fixed
// at creation. Three beats, hairline-divided, the §2 step anatomy (mono
// accent ordinal where a lifecycle glyph sits + display-sm heading + body).
// Copy doc §1.3 verbatim; no motion beyond the band's one-shot settle, so
// reduced motion is trivially satisfied.
import { Button, SectionBand } from "@riprap/ui";

import { Settle } from "../components/Settle";

const BEATS = [
  {
    n: "01",
    h: "Anyone sets it.",
    p: "A pool exists for whatever purpose its founder writes — cover a risk, pay for verified acts, fund the group's own rule. Creating one is a transaction, not a company formation. The rails are the platform's; the purpose is the group's.",
  },
  {
    n: "02",
    h: "It's fixed forever.",
    p: "The purpose is set when the pool is created and can never change: the terms are hashed and pinned on-chain, and a hash can't be edited. Members join knowing exactly what their money is for. A different purpose is a different pool.",
  },
  {
    n: "03",
    h: "Every payout is judged against it.",
    p: "A payout request goes to drawn peers, who rule with the pool's purpose as the measure. The pool holds the money; the purpose decides where it goes. No discretionary signer anywhere.",
  },
] as const;

export function Purpose() {
  return (
    <SectionBand id="purpose" label="purpose" tone="ground">
      <Settle className="flex flex-col gap-(--riprap-space-xl)">
        <div className="flex max-w-2xl flex-col gap-4">
          <h2 className="tracking-(--riprap-tracking-display) text-ink [font:var(--riprap-display-lg)]">
            Set the purpose. It's set forever.
          </h2>
        </div>

        <div className="border-t border-hairline">
          {BEATS.map((b) => (
            <div
              key={b.n}
              data-slot="purpose-beat"
              className="grid gap-4 border-b border-hairline py-8 sm:grid-cols-[3.5rem_1fr] sm:gap-10"
            >
              <span aria-hidden="true" className="font-mono text-sm text-accent sm:pt-1.5">
                {b.n}
              </span>
              <div>
                <h3 className="tracking-tight text-ink [font:var(--riprap-display-sm)]">{b.h}</h3>
                <p className="mt-3 max-w-2xl leading-relaxed text-body [font:var(--riprap-body-md)]">
                  {b.p}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Button asChild>
            <a href="#/create">Create a pool</a>
          </Button>
          <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
            Whatever purpose you want — it's fixed from the moment the pool exists.
          </p>
        </div>
      </Settle>
    </SectionBand>
  );
}
