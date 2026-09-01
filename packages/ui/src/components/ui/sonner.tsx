import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import type * as React from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/*
 * DESIGN.md chrome law applied to sonner: the toast is a card plate — card
 * ground, 1px hairline-strong edge, radius 0, ink text. No next-themes: this
 * kit is dark-first; [data-mode="paper"] flips the CSS vars underneath us.
 * Numerals inside a toast render mono: mark them up with <span data-num>.
 */
const Toaster = ({ theme = "dark", ...props }: ToasterProps) => {
  return (
    <Sonner
      theme={theme}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-success" />,
        info: <InfoIcon className="size-4 text-(--riprap-accent)" />,
        warning: <TriangleAlertIcon className="size-4 text-stone" />,
        error: <OctagonXIcon className="size-4 text-error" />,
        loading: <Loader2Icon className="size-4 text-muted-foreground animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--riprap-surface-card)",
          "--normal-text": "var(--riprap-ink)",
          "--normal-border": "var(--riprap-hairline-strong)",
          "--border-radius": "0px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "riprap-toast [font:var(--riprap-body-sm)] [&_[data-num]]:font-mono",
          description: "text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
