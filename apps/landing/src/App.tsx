// The platform landing (the default route) — copy doc §0–§7. Instance
// surfaces are hash routes (#/2026-breakpoint-blade-pool, #/app — lazy
// modules in src/pool/ and src/app/); this route stays Solana-free forever.

import { SiteNav } from "./components/SiteNav";
import { Faq } from "./sections/Faq";
import { FinalCta } from "./sections/FinalCta";
import { Footer } from "./sections/Footer";
import { Heritage } from "./sections/Heritage";
import { Hero } from "./sections/Hero";
import { Mechanism } from "./sections/Mechanism";
import { OnChain } from "./sections/OnChain";
import { Pools } from "./sections/Pools";
import { Purpose } from "./sections/Purpose";
import { Supporters } from "./sections/Supporters";

export function App() {
  return (
    <>
      <SiteNav />
      <main>
        <Hero />
        <Pools />
        <Purpose />
        <OnChain />
        <Mechanism />
        <Heritage />
        <Faq />
        <Supporters />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}

export default App;
