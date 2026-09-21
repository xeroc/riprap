// The platform landing (the default route) — copy doc §0–§7. Instance
// surfaces are hash routes (#/2026-breakpoint-blade-pool, #/app — lazy
// modules in src/pool/ and src/app/); this route stays Solana-free forever.

import { SiteNav } from "./components/SiteNav";
import { Audience } from "./sections/Audience";
import { Faq } from "./sections/Faq";
import { FinalCta } from "./sections/FinalCta";
import { Footer } from "./sections/Footer";
import { Heritage } from "./sections/Heritage";
import { Hero } from "./sections/Hero";
import { Mechanism } from "./sections/Mechanism";

export function App() {
  return (
    <>
      <SiteNav />
      <main>
        <Hero />
        <Mechanism />
        <Heritage />
        <Audience />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}

export default App;
