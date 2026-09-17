// Remotion's webpack bundler runs PostCSS on imported CSS. Tailwind v4's
// PostCSS plugin is the engine for the @riprap/ui css chain (same role
// @tailwindcss/vite plays in apps/landing). It also resolves the
// @import chain: tailwindcss → tw-animate-css → shadcn → @riprap/ui
// tokens (incl. Fontsource Space Grotesk / JetBrains Mono).
// Must stay a .js file at the package root — .mjs is not discovered,
// and the config silently not applying yields transparent/black frames.
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
