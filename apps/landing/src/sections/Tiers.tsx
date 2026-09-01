// Copy: meta/marketing/03-website-copy/landing-page.md § TIERS (prices from lib/poolMath TIERS
// — policy §5 tier table, the only allowed prices).
import { SvgFrame, TIERS, TierCapStations, usd } from "@riprap/ui";
import { ParamChip, Viz } from "./shared";

export function Tiers() {
  return (
    <section id="tiers" className="wrap" aria-labelledby="tiers-heading">
      <h2 id="tiers-heading">Tiers</h2>
      <Viz caption="Entry fee is the stone; the payout cap is a dashed ceiling, not a promise. Fee : cap = 1 : 100 in every tier.">
        <SvgFrame
          width={520}
          height={300}
          title="Tier cap stations — Basic, Standard, Premium"
          desc="Three stations: a fee stone of growing size class, and a hollow payout column with a dashed ceiling at the cap. Basic $10 to $1,000, Standard $20 to $2,000, Premium $40 to $4,000."
        >
          <TierCapStations x={64} baseline={200} />
        </SvgFrame>
      </Viz>
      <table>
        <thead>
          <tr>
            <th scope="col">Tier</th>
            <th scope="col">Entry fee</th>
            <th scope="col">Max payout</th>
          </tr>
        </thead>
        <tbody>
          {TIERS.map((tier) => (
            <tr key={tier.name}>
              <td>{tier.name}</td>
              <td className="num">{usd(tier.fee)}</td>
              <td className="num">{usd(tier.cap)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        Every tier: same peril, same window, same covered area, same pro-rata refund, same
        guaranteed dissolution. Entry fee is your maximum contribution.
      </p>
      <p className="cta-line">
        See the full comparison and exclusions → <ParamChip name="{{EXCLUSIONS}}" />
      </p>
      <p className="param-note">Parameter — published with the pool terms.</p>
    </section>
  );
}
