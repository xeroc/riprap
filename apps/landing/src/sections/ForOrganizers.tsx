// Copy: meta/marketing/03-website-copy/landing-page.md § FOR ORGANIZERS (verbatim).
import { ParamChip, XLink } from "./shared";

export function ForOrganizers() {
  return (
    <section id="organizers" className="wrap" aria-labelledby="organizers-heading">
      <h2 id="organizers-heading">Run a mutual at your event without holding a cent.</h2>
      <p>
        You sponsor the pool: you define the peril, the covered area, the coverage window, and the
        tiers. The pool program holds the money behind two governed exit doors. Peer jurors
        adjudicate claims — not your staff, not you. When the claims window closes, unused funds
        return to members and the pool dissolves. Nothing follows you home.
      </p>
      <p className="cta-line">
        Talk to us about sponsoring a pool → <ParamChip name="{{CONTACT_EMAIL}}" />
      </p>
      <p className="param-note">
        Parameter — published with the pool terms. Until then: <XLink />.
      </p>
    </section>
  );
}
