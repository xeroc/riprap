import type { Preview } from "@storybook/react-vite";
import "../src/tokens.css";

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
        light: { name: "light", value: "#f8fafc" },
        dark: { name: "dark", value: "#0b1220" },
      },
    },
  },
  globalTypes: {
    mode: {
      description:
        "Palette mode — same hues, two canvases (composition.md: never mix within a scene)",
      toolbar: {
        icon: "mirror",
        items: [
          { value: "light", title: "light" },
          { value: "dark", title: "dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const mode = context.globals.mode === "dark" ? "dark" : "light";
      return (
        <div data-mode={mode}>
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
