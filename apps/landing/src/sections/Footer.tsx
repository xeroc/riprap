import { FooterBand, LogoLockup, XLogo } from "@riprap/ui";

import { X_URL } from "./shared";

// §7 — Footer. Facts only: handle, domain, repo. Closing line per DESIGN.md.
export function Footer() {
  return (
    <FooterBand
      brand={
        <a href="#top" className="flex items-center gap-2.5" aria-label="Riprap home">
          <LogoLockup size={22} />
        </a>
      }
      tagline="Mutuals as a protocol on Solana. Any group, any terms, any lifetime."
      columns={[
        {
          heading: "page",
          links: [
            { href: "#mechanism", label: "How it works" },
            { href: "#lineage", label: "Lineage" },
          ],
        },
        {
          heading: "follow",
          links: [
            {
              href: X_URL,
              label: (
                <>
                  <XLogo className="mr-1.5 inline size-3.5" />
                  @riprapxyz
                </>
              ),
            },
          ],
        },
      ]}
      closing="© 2026 Riprap · riprap.xyz"
    />
  );
}
