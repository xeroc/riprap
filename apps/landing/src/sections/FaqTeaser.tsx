// Copy: meta/marketing/03-website-copy/landing-page.md § FAQ TEASER (verbatim).
import { ParamChip } from "./shared";

const ITEMS = [
  {
    q: "Is this insurance?",
    a: "No — a finite mutual. No insurer, no reserves, no surviving entity.",
  },
  {
    q: "What if claims exceed the pool?",
    a: "Payouts scale down proportionally. The pool can never pay more than it holds.",
  },
  {
    q: "Who are the jurors?",
    a: "Staked peers, drawn at random, weighted by stake, voting in commit-reveal. Appeals double the jury.",
  },
] as const;

export function FaqTeaser() {
  return (
    <section id="faq" className="wrap" aria-labelledby="faq-heading">
      <h2 id="faq-heading">FAQ</h2>
      <div className="faq">
        {ITEMS.map((item) => (
          <div key={item.q} className="faq-item">
            <h3>{item.q}</h3>
            <p>{item.a}</p>
          </div>
        ))}
      </div>
      <p className="cta-line">
        Full FAQ → <ParamChip name="{{FAQ_PAGE}}" />
      </p>
      <p className="param-note">Parameter — published before launch.</p>
    </section>
  );
}
