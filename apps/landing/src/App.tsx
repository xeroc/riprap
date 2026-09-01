// The lean landing composition — copy doc §0–§7.
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
