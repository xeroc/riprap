import type { Meta, StoryObj } from "@storybook/react-vite";
import { Container } from "./Container";

const meta = {
  title: "Chrome/Container",
  component: Container,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Container>;

export default meta;

export const Default: StoryObj<typeof meta> = {
  render: () => (
    <div className="bg-ground py-16">
      <Container className="border border-dashed border-hairline p-4 text-muted-foreground [font:var(--riprap-mono-label)]">
        content column — capped at 1200px, guttered 16/24px
      </Container>
    </div>
  ),
};
