// The static landing page — meta/marketing/03-website-copy/landing-page.md, in order.

import { FaqTeaser } from "./sections/FaqTeaser";
import { FinalCta } from "./sections/FinalCta";
import { Footer } from "./sections/Footer";
import { ForOrganizers } from "./sections/ForOrganizers";
import { Hero } from "./sections/Hero";
import { HowItWorks } from "./sections/HowItWorks";
import { Problem } from "./sections/Problem";
import { TheMath } from "./sections/TheMath";
import { Tiers } from "./sections/Tiers";
import { WhyHonest } from "./sections/WhyHonest";

export function App() {
  return (
    <>
      <header className="site-header">
        <div className="wrap header-row">
          <span className="wordmark">Riprap</span>
          <nav aria-label="Sections">
            <a href="#problem">The problem</a>
            <a href="#how-it-works">How it works</a>
            <a href="#math">The math</a>
            <a href="#tiers">Tiers</a>
            <a href="#join">Join</a>
          </nav>
        </div>
      </header>
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <TheMath />
        <WhyHonest />
        <ForOrganizers />
        <Tiers />
        <FaqTeaser />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}

export default App;
