import { FooterBand, LogoLockup } from "@riprap/ui";

import { GITHUB_URL, X_URL } from "./shared";

// §7 — Footer. Facts only: handle, domain, repo. Closing line per DESIGN.md.
export function Footer() {
  return (
    <FooterBand
      brand={
        <a href="#top" className="flex items-center gap-2.5" aria-label="Riprap — home">
          <LogoLockup size={22} />
        </a>
      }
      tagline="Event mutuals on Solana. One pool, one peril, one event — then it's gone."
      columns={[
        {
          heading: "page",
          links: [
            { href: "#mechanism", label: "How it works" },
            { href: "#guarantees", label: "Guarantees" },
            { href: "#lineage", label: "Lineage" },
          ],
        },
        {
          heading: "follow",
          links: [
            { href: X_URL, label: "@riprapxyz" },
            { href: GITHUB_URL, label: "GitHub" },
          ],
        },
      ]}
      closing="© 2026 Riprap · pre-launch · riprap.xyz · dead on schedule"
    />
  );
}
