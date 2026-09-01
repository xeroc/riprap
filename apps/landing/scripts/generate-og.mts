/**
 * Generates apps/landing/public/og.png (1200x630) — the Open Graph card:
 * near-black ground, the ring (same geometry as the favicon/Logomark), the
 * wordmark, and the platform one-liner. Fonts are embedded as base64 woff2
 * so the file renders identically anywhere; hex values are inherent to a
 * static asset and mirror tokens.css (ground #0C0E10, ink #f2efe8,
 * body #c9cdd1, muted #8a9096, stone #a7adb3, accent #3e7ca6).
 *
 * Run: pnpm dlx tsx apps/landing/scripts/generate-og.mts
 * (rasterizes via system chromium; falls back to rsvg-convert)
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  BLUE_INDEX,
  GAP_INDEX,
  RING_SEEDS,
  slotPosition,
  stonePoints,
  stoneRotation,
  STONE_SIZES,
} from "@riprap/ui";

const W = 1200;
const H = 630;
const RING_VIEWBOX = 96; // favicon/Logomark coordinate space
const RING_SCALE = 3.6; // ~345px ring
const RING_CENTER = { x: 905, y: H / 2 };
const STONE_SCALE = 0.55; // identical to Logomark

const tmp = mkdtempSync(path.join(os.tmpdir(), "riprap-og-"));
const fontDir = (pkg: string) =>
  path.resolve(import.meta.dirname, `../node_modules/@fontsource-variable/${pkg}/files`);

const grotesk = readFileSync(
  path.join(fontDir("space-grotesk"), "space-grotesk-latin-wght-normal.woff2"),
).toString("base64");
const mono = readFileSync(
  path.join(fontDir("jetbrains-mono"), "jetbrains-mono-latin-wght-normal.woff2"),
).toString("base64");

const stones: string[] = [];
for (let slot = 0; slot < 8; slot++) {
  if (slot === GAP_INDEX) continue; // the open slot — open membership
  const p = slotPosition(slot);
  const rot = stoneRotation(RING_SEEDS[slot]);
  const pts = stonePoints("S", RING_SEEDS[slot])
    .map((pt) => `${(pt.x * STONE_SCALE).toFixed(2)},${(pt.y * STONE_SCALE).toFixed(2)}`)
    .join(" ");
  const x = RING_CENTER.x - (RING_VIEWBOX / 2) * RING_SCALE + p.x * RING_SCALE;
  const y = RING_CENTER.y - (RING_VIEWBOX / 2) * RING_SCALE + p.y * RING_SCALE;
  stones.push(
    `  <polygon transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${RING_SCALE}) rotate(${rot.toFixed(2)})" points="${pts}" fill="${slot === BLUE_INDEX ? "#3e7ca6" : "#a7adb3"}"/>`,
  );
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <style>
    @font-face { font-family: "Space Grotesk Variable"; src: url(data:font/woff2;base64,${grotesk}) format("woff2"); font-weight: 300 700; }
    @font-face { font-family: "JetBrains Mono Variable"; src: url(data:font/woff2;base64,${mono}) format("woff2"); font-weight: 100 800; }
    text { font-family: "Space Grotesk Variable", system-ui, sans-serif; }
    .mono { font-family: "JetBrains Mono Variable", monospace; }
  </style>
  <rect width="${W}" height="${H}" fill="#0C0E10"/>
  <rect x="40" y="40" width="${W - 80}" height="${H - 80}" fill="none" stroke="#2a2e33" stroke-width="1"/>
  <text class="mono" x="96" y="208" font-size="21" letter-spacing="4.5" fill="#3e7ca6">EVENT MUTUALS ON SOLANA</text>
  <text x="94" y="330" font-size="122" font-weight="600" fill="#f2efe8">Riprap</text>
  <text x="96" y="396" font-size="30" fill="#c9cdd1">Any event. Any narrow peril.</text>
  <text x="96" y="438" font-size="30" fill="#c9cdd1">One finite pool.</text>
  <text class="mono" x="96" y="530" font-size="20" fill="#8a9096">riprap.xyz</text>
${stones.join("\n")}
</svg>
`;

const htmlPath = path.join(tmp, "og.html");
const pngPath = path.join(tmp, "og.png");
writeFileSync(htmlPath, `<!doctype html><html><head><style>html,body{margin:0;padding:0}</style></head><body>${svg}</body></html>`);

try {
  execFileSync(
    "chromium",
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      `--screenshot=${pngPath}`,
      `--window-size=${W},${H}`,
      `file://${htmlPath}`,
    ],
    { stdio: "pipe" },
  );
} catch {
  // rsvg-convert fallback: it reads the .svg directly (font data-URIs included)
  const svgPath = path.join(tmp, "og.svg");
  writeFileSync(svgPath, svg);
  execFileSync("rsvg-convert", ["-w", String(W), "-h", String(H), "-o", pngPath, svgPath], {
    stdio: "pipe",
  });
}

execFileSync("magick", ["identify", pngPath], { stdio: "pipe" }); // fails unless rasterized
const out = path.resolve(import.meta.dirname, "../public/og.png");
writeFileSync(out, readFileSync(pngPath));
console.log(`og.png written: ${W}x${H} -> ${out}`);
console.log(`stone width source: S=${STONE_SIZES.S}px @ scale ${STONE_SCALE}, ring scale ${RING_SCALE}`);
