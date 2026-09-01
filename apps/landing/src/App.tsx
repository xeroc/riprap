// The static landing page — lean structure per meta/marketing/03-website-copy/landing-page.md
// (mirrors the Accord landing: nav, hero+waitlist, mechanism, guarantees, lineage, audience, final CTA, footer).

import { Audience } from "./sections/Audience";
import { FinalCta } from "./sections/FinalCta";
import { Footer } from "./sections/Footer";
import { Guarantees } from "./sections/Guarantees";
import { Heritage } from "./sections/Heritage";
import { Hero } from "./sections/Hero";
import { Mechanism } from "./sections/Mechanism";
import { Nav } from "./sections/Nav";

export function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Mechanism />
        <Guarantees />
        <Heritage />
        <Audience />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}

export default App;
