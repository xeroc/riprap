// The Breakpoint 2026 event lockup chip — the event site's nav lockup
// (public/breakpoint-assets/), black on the event pink at half the site's
// nav size (founder ask). Shared by the mutuals carousel (floating above
// each card) and the /mutuals table (inline per row) — callers pass the
// positioning classes.
export function BpBadge({ className = "" }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Breakpoint 2026"
      className={`flex items-center gap-[3.57px] bg-(--bp-2026-pink) px-2 text-black ${className}`}
    >
      <img
        src="/breakpoint-assets/nav-solana.svg"
        alt=""
        aria-hidden="true"
        className="block h-[9.78px] w-[11.34px]"
      />
      <img
        src="/breakpoint-assets/nav-bp26.svg"
        alt=""
        aria-hidden="true"
        className="block h-[10px] w-[52.23px]"
      />
    </span>
  );
}
