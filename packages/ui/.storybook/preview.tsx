import type { Preview } from "@storybook/react-vite";
import "../src/main.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      options: {
        ground: { name: "ground (dark)", value: "#0c0e10" },
        paper: { name: "paper (light)", value: "#f2efe8" },
      },
      default: "ground",
    },
  },
  globalTypes: {
    mode: {
      description: "Palette mode — dark ground (default) or paper inversion (DESIGN.md)",
      toolbar: {
        icon: "mirror",
        items: [
          { value: "ground", title: "ground" },
          { value: "paper", title: "paper" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const mode = context.globals.mode === "paper" ? "paper" : "ground";
      return (
        <div data-mode={mode === "paper" ? "paper" : undefined}>
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
