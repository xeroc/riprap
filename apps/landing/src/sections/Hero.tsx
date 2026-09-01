// Copy: meta/marketing/03-website-copy/landing-page.md § HERO (verbatim).
import { SvgFrame, WaveBreak } from "@riprap/ui";
import { ParamChip, Viz } from "./shared";

export function Hero() {
  return (
    <section id="top" className="wrap hero" aria-labelledby="hero-heading">
      <div className="hero-copy">
        <p className="kicker">Event mutuals on Solana.</p>
        <h1 id="hero-heading">Any event. Any narrow peril. One finite pool.</h1>
        <p className="subhead">
          Riprap is the event-scoped mutual primitive on Solana. A sponsor scopes a pool — one
          peril, one covered area, one event window — members pay a fixed entry fee, peer jurors
          adjudicate claims, unused funds return pro-rata, and the pool dissolves. First pool:
          Riprap: Blade Pool @ Breakpoint 2026 — 15–17 November 2026, Olympia Convention Centre +
          designated event area, London; peril defined in the policy.
        </p>
        <div className="cta-row">
          <a className="btn btn-primary" href="#how-it-works">
            See how a pool works
          </a>
          <a className="btn btn-secondary" href="#join">
            Join Riprap: Blade Pool @ Breakpoint 2026
          </a>
        </div>
        <p className="param-note">
          Policy and exclusions: <ParamChip name="{{EXCLUSIONS}}" /> — published with the pool
          terms.
        </p>
      </div>
      <Viz caption="The riprap cross-section: stones settle, the wave breaks, the stones remain.">
        <SvgFrame
          width={360}
          height={240}
          title="A wave breaks on a pile of loose stones; the stones hold"
          desc="The peril arrives as a wave mass from one side, breaks apart on impact, and the stone pile remains in place."
        >
          <WaveBreak x={140} y={150} />
        </SvgFrame>
      </Viz>
    </section>
  );
}
