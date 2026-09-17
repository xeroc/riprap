import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "../ui/button";
import { JurorUpsellDialog, type JurorUpsellDialogProps } from "./JurorUpsellDialog";

const meta = {
  title: "Chrome/JurorUpsellDialog",
  component: JurorUpsellDialog,
  parameters: { layout: "centered" },
} satisfies Meta<typeof JurorUpsellDialog>;

export default meta;

// sample copy — the real strings live in the landing copy doc
// (meta/marketing/03-website-copy/landing-page.md) and the page passes them;
// minStake sample only — the page passes mutual.min_stake formatted
const args: JurorUpsellDialogProps = {
  open: false,
  onOk: () => {},
  minStake: "$10",
  title: "The pool needs jurors",
  body: "Members who stake can be drawn to review claims.",
};

function Playground(props: JurorUpsellDialogProps) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Show juror invitation
      </Button>
      <JurorUpsellDialog {...props} {...args} open={open} onOk={() => setOpen(false)} />
    </>
  );
}

export const Default: StoryObj<typeof meta> = {
  args,
  render: (renderArgs) => <Playground {...renderArgs} />,
};
