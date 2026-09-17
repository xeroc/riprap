import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { Backstop } from "./Backstop";
import { Claim } from "./Claim";
import { ExpansionStrip } from "./ExpansionStrip";
import { Found } from "./Found";
import { Gather } from "./Gather";
import { HexBackdrop } from "./HexBackdrop";
import { Join } from "./Join";
import { LifecycleStrip } from "./LifecycleStrip";
import { OnePool } from "./OnePool";
import { Renew } from "./Renew";
import { Return } from "./Return";
import { Rule } from "./Rule";
import { Stack } from "./Stack";

const meta = {
  title: "Illustrations/Glyphs",
  parameters: { layout: "centered" },
} satisfies Meta;

export default meta;

function Frame({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-24 p-4">{children}</div>;
}

export const GatherStory: StoryObj = {
  name: "gather — money gathers",
  render: () => (
    <Frame>
      <Gather />
    </Frame>
  ),
};

export const JoinStory: StoryObj = {
  name: "join — one more member",
  render: () => (
    <Frame>
      <Join />
    </Frame>
  ),
};

export const ClaimStory: StoryObj = {
  name: "claim — a claim is paid",
  render: () => (
    <Frame>
      <Claim />
    </Frame>
  ),
};

export const RuleStory: StoryObj = {
  name: "rule — peers decide",
  render: () => (
    <Frame>
      <Rule />
    </Frame>
  ),
};

export const ReturnStory: StoryObj = {
  name: "return — what's left returns",
  render: () => (
    <Frame>
      <Return />
    </Frame>
  ),
};

export const Strip: StoryObj = {
  name: "lifecycle strip — the whole product",
  render: () => (
    <div className="p-8">
      <LifecycleStrip />
    </div>
  ),
};

export const Backdrop: StoryObj = {
  name: "hex backdrop — engineering paper",
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="relative h-screen w-full overflow-hidden bg-ground">
      <HexBackdrop className="absolute inset-0 size-full" />
    </div>
  ),
};

export const PoolStory: StoryObj = {
  name: "pool — one pool, one risk",
  render: () => (
    <Frame>
      <OnePool />
    </Frame>
  ),
};

export const FoundStory: StoryObj = {
  name: "found — anyone founds one",
  render: () => (
    <Frame>
      <Found />
    </Frame>
  ),
};

export const RenewStory: StoryObj = {
  name: "renew — cover renews",
  render: () => (
    <Frame>
      <Renew />
    </Frame>
  ),
};

export const BackstopStory: StoryObj = {
  name: "backstop — a backstop grows",
  render: () => (
    <Frame>
      <Backstop />
    </Frame>
  ),
};

export const StackStory: StoryObj = {
  name: "stack — pools cover pools",
  render: () => (
    <Frame>
      <Stack />
    </Frame>
  ),
};

export const Expansion: StoryObj = {
  name: "expansion strip — the machines on-chain cover needs",
  render: () => (
    <div className="p-8">
      <ExpansionStrip />
    </div>
  ),
};
