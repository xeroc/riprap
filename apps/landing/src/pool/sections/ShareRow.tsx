// ShareRow — the covered overlay's share field (copy doc § Covered overlay,
// 2026-09-24): the join moment's word-of-mouth ask. One short message, posted
// in a click or two — X / Farcaster / Telegram composers open with the text
// prefilled, or the pool URL copies to the clipboard. The message must carry
// @riprapxyz (the mention-watcher keys supporters off it — copy doc §5.6).
// Figures arrive formatted from the member's tier (the stamp's read); while
// the tier is unread the figures clause drops out — numbers are never faked.

import { Button, XLogo } from "@riprap/ui";
import { Link2 } from "lucide-react";
import { toast } from "sonner";

// Copy doc § Covered overlay: the shared URL is the printed pool path — the
// public/ stub keeps it working.
const POOL_URL = "https://riprap.xyz/2026-breakpoint-blade-pool";
const HANDLE = "@riprapxyz";

/** The prefilled message (copy doc § Covered overlay, verbatim minus slots). */
export function shareText(fee: string | null, cap: string | null): string {
  const figures = fee !== null && cap !== null ? `${fee} in, up to ${cap} out — ` : "";
  return `${figures}Blade Pool at Breakpoint 2026, claims juried by members. I'm in. ${HANDLE}`;
}

/** Composer intents — the platform prefills the message; the member posts. */
function intentHref(kind: "x" | "farcaster" | "telegram", text: string): string {
  const full = `${text} ${POOL_URL}`;
  switch (kind) {
    case "x":
      return `https://twitter.com/intent/tweet?text=${encodeURIComponent(full)}`;
    case "farcaster":
      return `https://warpcast.com/~/compose?text=${encodeURIComponent(full)}`;
    case "telegram":
      return `https://t.me/share/url?url=${encodeURIComponent(POOL_URL)}&text=${encodeURIComponent(text)}`;
  }
}

/** The Farcaster glyph — currentColor (simple-icons path, CC0). */
function FarcasterGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      width="1em"
      height="1em"
    >
      <path d="M18.24.24H5.76C2.5789.24 0 2.8188 0 6v12c0 3.1811 2.5789 5.76 5.76 5.76h12.48c3.1812 0 5.76-2.5789 5.76-5.76V6C24 2.8188 21.4212.24 18.24.24m.8155 17.1662v.504c.2868-.0256.5458.1905.5439.479v.5688h-5.1437v-.5688c-.0019-.2885.2576-.5047.5443-.479v-.504c0-.22.1525-.402.358-.458l-.0095-4.3645c-.1589-1.7366-1.6402-3.0979-3.4435-3.0979-1.8038 0-3.2846 1.3613-3.4435 3.0979l-.0096 4.3578c.2276.0424.5318.2083.5395.4648v.504c.2863-.0256.5457.1905.5438.479v.5688H4.3915v-.5688c-.0019-.2885.2575-.5047.5438-.479v-.504c0-.2529.2011-.4548.4536-.4724v-7.895h-.4905L4.2898 7.008l2.6405-.0005V5.0419h9.9495v1.9656h2.8219l-.6091 2.0314h-.4901v7.8949c.2519.0177.453.2195.453.4724" />
    </svg>
  );
}

/** The Telegram glyph — currentColor (simple-icons path, CC0). */
function TelegramGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      width="1em"
      height="1em"
    >
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(POOL_URL);
    toast("Link copied.");
  } catch {
    toast(`Couldn't copy — the link is ${POOL_URL}`);
  }
}

/** A share target: outline icon button opening the composer in a new tab. */
function ShareButton({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Button variant="outline" size="icon" asChild>
      <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
        {children}
      </a>
    </Button>
  );
}

export function ShareRow({ fee, cap }: { fee: string | null; cap: string | null }) {
  const text = shareText(fee, cap);
  return (
    <div
      data-slot="share-row"
      className="flex flex-col items-center gap-2 rounded-none border border-hairline px-3 py-2.5"
    >
      <p className="uppercase tracking-(--riprap-tracking-stamp) text-muted-soft [font:var(--riprap-mono-label)]">
        Share
      </p>
      <p className="max-w-[22rem] leading-relaxed text-muted-foreground [font:var(--riprap-body-sm)]">
        Post it with @riprapxyz — everyone who shares lands on the front page as a supporter, linked
        to their post.
      </p>
      <div className="flex items-center gap-2">
        <ShareButton href={intentHref("x", text)} label="Share on X">
          <XLogo className="size-4" />
        </ShareButton>
        <ShareButton href={intentHref("farcaster", text)} label="Share on Farcaster">
          <FarcasterGlyph className="size-4" />
        </ShareButton>
        <ShareButton href={intentHref("telegram", text)} label="Share on Telegram">
          <TelegramGlyph className="size-4" />
        </ShareButton>
        <Button
          variant="outline"
          size="icon"
          onClick={() => void copyLink()}
          aria-label="Copy link"
          title="Copy link"
        >
          <Link2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
