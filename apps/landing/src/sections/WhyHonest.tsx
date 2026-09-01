// Copy: meta/marketing/03-website-copy/landing-page.md § WHY IT'S HONEST (verbatim).
import { PoolVessel, SvgFrame } from "@riprap/ui";
import { Viz } from "./shared";

export function WhyHonest() {
  return (
    <section id="honest" className="wrap" aria-labelledby="honest-heading">
      <h2 id="honest-heading">What this is not.</h2>
      <ul className="not-list">
        <li>
          Not insurance — no reserves, no underwriting beyond tier caps, no profit, no surviving
          entity. It's a finite mutual that dissolves on schedule.
        </li>
        <li>
          Not a "trustless court" — claims are adjudicated by Accord, a sister protocol that is
          honestly an <strong>arbitration oracle</strong>: randomly drawn, stake-weighted jurors,
          commit-reveal voting, appeals that double the jury. The honesty equilibrium holds
          conditional on an honest stake majority. That caveat is a feature of the design, so it's a
          feature of this page.
        </li>
        <li>
          Not a treasury that lingers — money leaves a pool through exactly two governed doors
          (spending via adjudication, liquidation at the end), and dissolution is permissionless. No
          third path, no discretionary signer.
        </li>
      </ul>
      <Viz caption="The pool vessel, worked example: $12,000 of $20,000 remains after four approved claims. Money leaves through one of two governed doors — spending (adjudicated) or liquidation. No third path.">
        <SvgFrame
          width={600}
          height={360}
          title="The pool vessel with exactly two governed exit doors"
          desc="An open-top vessel holding the remaining pool; a spending door in the right wall, adjudicated, and a liquidation door in the bottom. No third exit."
        >
          <PoolVessel balance={12000} maxBalance={20000} x={48} y={44} surfaceStones={3} />
        </SvgFrame>
      </Viz>
    </section>
  );
}
