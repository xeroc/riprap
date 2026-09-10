// The lean landing composition — copy doc §0–§7.
import { BreakpointPage } from "./pages/BreakpointPage";

import { Audience } from "./sections/Audience";
import { FinalCta } from "./sections/FinalCta";
import { Footer } from "./sections/Footer";
import { Heritage } from "./sections/Heritage";
import { Hero } from "./sections/Hero";
import { Mechanism } from "./sections/Mechanism";
import { Nav } from "./sections/Nav";

export function App() {
  // static host serves index.html for every path (SPA fallback); the pool
  // page is one route off the platform landing — no router dependency
  if (
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/2026-breakpoint-blade-pool")
  ) {
    return <BreakpointPage />;
  }
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
