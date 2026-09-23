// #/blurb — the unlisted blurb & brand kit page, lazy-loaded by the router
// in src/main.tsx. Solana-free like the platform route; not linked from
// any navigation, llms.txt, or sitemap — it moves by direct link in
// intro threads (founder call 2026-09-23).
import { BlurbPage } from "./BlurbPage.tsx";

export default function BlurbEntry() {
  return <BlurbPage />;
}
