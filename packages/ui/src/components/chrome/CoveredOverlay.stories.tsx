import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "../ui/button";
import { CoveredOverlay, type CoveredOverlayProps } from "./CoveredOverlay";

const meta = {
  title: "Chrome/CoveredOverlay",
  component: CoveredOverlay,
  parameters: { layout: "centered" },
} satisfies Meta<typeof CoveredOverlay>;

export default meta;

// sample copy — the real strings live in the landing copy doc § Covered
// overlay (meta/marketing/03-website-copy/landing-page.md); the pool page
// passes them with chain-formatted figures ($10/$20/$40 · policy §5).
const args: CoveredOverlayProps = {
  open: false,
  onDismiss: () => {},
  stamp: "Covered — Standard",
  headline: "You're in the ring.",
  figures: [
    <span key="fee">
      <span data-num className="font-mono">
        $20
      </span>{" "}
      in
    </span>,
    <span key="cap">
      up to{" "}
      <span data-num className="font-mono">
        $2,000
      </span>{" "}
      out
    </span>,
    <span key="total">
      pool holds{" "}
      <span data-num className="font-mono">
        $4,020
      </span>
    </span>,
  ],
  juror: {
    label: "Juror",
    body: (
      <>
        Stake{" "}
        <span data-num className="font-mono">
          $10
        </span>
        , get drawn to read the evidence, get paid when coherent. Unstake anytime.
      </>
    ),
    action: "Become a juror",
    href: "#/app#jurors",
  },
};

/** The replay surface (copy doc § Covered overlay): the demo trigger —
 *  production fires it once per session on the covered read, never by hand. */
function Playground(props: CoveredOverlayProps) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Replay the moment
      </Button>
      <CoveredOverlay {...props} {...args} open={open} onDismiss={() => setOpen(false)} />
    </>
  );
}

export const Default: StoryObj<typeof meta> = {
  args,
  render: (renderArgs) => <Playground {...renderArgs} />,
};
