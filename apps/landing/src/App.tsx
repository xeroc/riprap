// The platform landing (the default route) — copy doc §0–§7. Instance
// surfaces are hash routes (#/2026-breakpoint-blade-pool, #/app — lazy
// modules in src/pool/ and src/app/); this route stays Solana-free forever.

import { SiteNav } from "./components/SiteNav";
import { Audience } from "./sections/Audience";
import { Compare } from "./sections/Compare";
import { Faq } from "./sections/Faq";
import { FinalCta } from "./sections/FinalCta";
import { Footer } from "./sections/Footer";
import { Heritage } from "./sections/Heritage";
import { Hero } from "./sections/Hero";
import { Mechanism } from "./sections/Mechanism";
import { Mutuals } from "./sections/Mutuals";
import { OnChain } from "./sections/OnChain";
import { Supporters } from "./sections/Supporters";

export function App() {
  return (
    <>
      <SiteNav />
      <main>
        <Hero />
        <Mutuals />
        <OnChain />
        <Compare />
        <Mechanism />
        <Heritage />
        <Audience />
        <Faq />
        <Supporters />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}

export default App;
