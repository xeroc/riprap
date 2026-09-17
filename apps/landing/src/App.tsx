// The platform landing (the / entry) — copy doc §0–§7. Instance surfaces are
// separate MPA entries (/2026-breakpoint-blade-pool/, /app/), each with its own
// head in its index.html; this entry stays Solana-free forever.
import { Audience } from "./sections/Audience";
import { FinalCta } from "./sections/FinalCta";
import { Footer } from "./sections/Footer";
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
        <Heritage />
        <Audience />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}

export default App;
