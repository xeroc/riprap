// Copy: meta/marketing/03-website-copy/landing-page.md § THE MATH (verbatim).
import { StandardStory } from "@riprap/ui";
import { Viz } from "./shared";

// Worked example (policy §10 / meta/PROJECT.md): same numbers StandardStory renders.
const ROWS = [
  ["1,000 members × $20 Standard entry", "$20,000 pool"],
  ["4 approved claims × $2,000", "$8,000 paid out"],
  ["Remaining pool", "$12,000"],
  ["Returned to each member", "$12"],
  ["After that", "pool dissolved"],
] as const;

export function TheMath() {
  return (
    <section id="math" className="wrap" aria-labelledby="math-heading">
      <h2 id="math-heading">1,000 people. Twenty dollars each.</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Step</th>
            <th scope="col">Amount</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map(([step, amount]) => (
            <tr key={step}>
              <td>{step}</td>
              <td className="num">{amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        That's the whole product. If claims are fewer or smaller, refunds are bigger. If approved
        claims exceed the pool, payouts scale down proportionally — the mutual can never pay more
        than it holds, because there is nothing else to hold.
      </p>
      <Viz caption="The standard story in four frames — collect, absorb, return, dissolve — on the shared $20,000 scale.">
        <StandardStory />
      </Viz>
    </section>
  );
}
