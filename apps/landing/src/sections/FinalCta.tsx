// Copy: meta/marketing/03-website-copy/landing-page.md § FINAL CTA (verbatim).
import { ParamChip, XLink } from "./shared";

export function FinalCta() {
  return (
    <section id="join" className="wrap join" aria-labelledby="join-heading">
      <h2 id="join-heading">No mortar. Just stones that lean on each other.</h2>
      <p>
        Riprap: Blade Pool opens at Breakpoint 2026 — Olympia Convention Centre, London, 15–17
        November. Join the list to get the join link and remaining parameters the moment they're
        set.
      </p>
      <p className="cta-line">
        Get first-pool details → <ParamChip name="{{MAILING_LIST}}" />
      </p>
      <p className="param-note">
        Parameter — the mailing list goes live with the join link, published before anyone pays
        anything. Until then: <XLink />.
      </p>
      <p className="footnote">
        Pre-launch. Event, venue, and dates are set (Breakpoint 2026, Olympia Convention Centre +
        designated event area, London, 15–17 November 2026). Still open: round-1 juror count N,
        round-1 juror fee size, claims-window length, join link — all published before anyone pays
        anything.
      </p>
    </section>
  );
}
