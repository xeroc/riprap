// /app shell: wayfinding chrome only — no invented copy (every user-visible
// string lands with its copy-doc entry first). The wallet gate replaces the
// empty main in the on-chain join milestone.
import { LogoLockup, TopNav } from "@riprap/ui";

export function AppPage() {
  return (
    <>
      <TopNav
        className="sticky top-0 z-40"
        links={[{ href: "/", label: "riprap.xyz" }]}
        brand={<LogoLockup size={22} />}
      />
      <main />
    </>
  );
}
