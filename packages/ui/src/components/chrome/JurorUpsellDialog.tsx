import type * as React from "react";

import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

/**
 * `JurorUpsellDialog` — the post-join juror invitation, OK-only. The kit
 * stays copy-free: title, body and okLabel arrive as props (the landing
 * copy doc owns the words; the page passes them and they render verbatim).
 * `minStake` is the one data figure — a mono number on a strong plate
 * (DESIGN.md: number plates), `data-num` marked. Every dismissal path (the
 * OK button, Escape, overlay click) is `onOk` — there is no other exit.
 *
 * The dialog itself settles by opacity (the kit Dialog); nothing bounces,
 * and `prefers-reduced-motion` collapses it to the final state.
 */
export interface JurorUpsellDialogProps {
  open: boolean;
  /** fires on OK — and on any dismissal (Escape / overlay): OK-only semantics */
  onOk: () => void;
  /** formatted stake floor, rendered verbatim in mono (e.g. "$10" — the page formats) */
  minStake: string;
  /** modal copy from the page, rendered verbatim */
  title: string;
  /** body copy from the page, rendered verbatim */
  body: React.ReactNode;
  /** OK button label (default "OK") */
  okLabel?: string;
}

export function JurorUpsellDialog({
  open,
  onOk,
  minStake,
  title,
  body,
  okLabel = "OK",
}: JurorUpsellDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onOk();
      }}
    >
      <DialogContent showCloseButton={false} className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{body}</DialogDescription>
        </DialogHeader>
        <div
          data-slot="juror-min-stake"
          className="rounded-none border border-hairline bg-strong px-4 py-3"
        >
          <span data-num="" className="text-ink [font:var(--riprap-mono-number-lg)]">
            {minStake}
          </span>
        </div>
        <DialogFooter>
          <Button onClick={onOk}>{okLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
