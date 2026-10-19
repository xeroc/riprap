/**
 * generate-banner.mts — one-off banner renderer: the generate-og.mts visual
 * system (near-black ground, hairline frame, stone ring, Space Grotesk +
 * JetBrains Mono) with every string, size and color as a CLI flag. The only
 * fixed content is the riprap.xyz URL at the bottom.
 *
 * Run (repo root):
 *   pnpm dlx tsx apps/landing/scripts/generate-banner.mts \
 *     --kicker "BLADE POOL @ BREAKPOINT 2026" --title "Stolen blade?" \
 *     --sub "File a claim. Your pool adjudicates." --out blade-banner.png
 *
 * Flags (all optional):
 *   --kicker <text>   mono eyebrow above the title (accent color)
 *   --title <text>    main line (ink)
 *   --sub <text>      body line — repeat the flag for more lines (body color)
 *   --out <path>      output PNG, cwd-relative (default ./banner.png)
 *   --width <px> / --height <px>
 *                     canvas size (default 1200x630, the OG geometry; other
 *                     sizes scale that layout uniformly and center it)
 *   --no-ring         drop the stone ring (text-only banner)
 *   --ground/--ink/--body/--muted/--accent/--stone/--hairline <hex>
 *                     color overrides; defaults mirror tokens.css (ground
 *                     #0C0E10, ink #f2efe8, body #c9cdd1, muted #8a9096,
 *                     stone #a7adb3, accent #3e7ca6, hairline #2a2e33) — hex
 *                     is inherent to a static asset, same as generate-og.mts
 *   --help            print usage
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { parseArgs } from "node:util";
import {
  BLUE_INDEX,
  GAP_INDEX,
  RING_SEEDS,
  slotPosition,
  stonePoints,
  stoneRotation,
} from "@riprap/ui";

const USAGE = `Usage: pnpm dlx tsx apps/landing/scripts/generate-banner.mts [flags]
  --kicker <text>            mono eyebrow above the title (accent)
  --title-size <px> title font size (default 122 — shrink for long titles
                     so they clear the stone ring)
  --sub <text>               body line; repeat flag for more lines
  --out <path>               output PNG (default ./banner.png)
  --width <px> --height <px> canvas (default 1200x630)
  --no-ring                  drop the stone ring
  --ground|--ink|--body|--muted|--accent|--stone|--hairline <hex>
  --help`;

const { values } = parseArgs({
  options: {
    kicker: { type: "string" },
    title: { type: "string" },
    "title-size": { type: "string" },
    sub: { type: "string", multiple: true },
    out: { type: "string" },
    width: { type: "string" },
    height: { type: "string" },
    "no-ring": { type: "boolean", default: false },
    ground: { type: "string" },
    ink: { type: "string" },
    body: { type: "string" },
    muted: { type: "string" },
    accent: { type: "string" },
    stone: { type: "string" },
    hairline: { type: "string" },
    help: { type: "boolean", default: false },
  },
});
if (values.help) {
  console.log(USAGE);
  process.exit(0);
}

const W = Number(values.width ?? 1200);
const H = Number(values.height ?? 630);
const TITLE_SIZE = Number(values["title-size"] ?? 122);
if (
  !Number.isFinite(W) ||
  !Number.isFinite(H) ||
  W <= 0 ||
  H <= 0 ||
  !Number.isFinite(TITLE_SIZE) ||
  TITLE_SIZE <= 0
) {
  throw new Error(`bad size: ${values.width}x${values.height} title=${values["title-size"]}`);
}

const C = {
  ground: values.ground ?? "#0C0E10",
  ink: values.ink ?? "#f2efe8",
  body: values.body ?? "#c9cdd1",
  muted: values.muted ?? "#8a9096",
  accent: values.accent ?? "#3e7ca6",
  stone: values.stone ?? "#a7adb3",
  hairline: values.hairline ?? "#2a2e33",
};
const kicker = values.kicker ?? "RISK POOLS ON SOLANA";
const title = values.title ?? "Riprap";
const subs = values.sub ?? ["Finance went P2P.", "Risk Cover can too."];
const outPath = path.resolve(process.cwd(), values.out ?? "banner.png");

/** arbitrary user text → safe SVG text content */
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Layout in OG units (1200x630), scaled by s and centered — identical to
// generate-og.mts at the default size.
const s = Math.min(W / 1200, H / 630);
const ox = (W - 1200 * s) / 2;
const oy = (H - 630 * s) / 2;
const X = 96 * s + ox; // text column left edge
const RING_SCALE = 3.6 * s;
const STONE_SCALE = 0.55; // identical to Logomark
const RING_VIEWBOX = 96; // favicon/Logomark coordinate space

const tmp = mkdtempSync(path.join(os.tmpdir(), "riprap-banner-"));
const fontDir = (pkg: string) =>
  path.resolve(import.meta.dirname, `../node_modules/@fontsource-variable/${pkg}/files`);

const grotesk = readFileSync(
  path.join(fontDir("space-grotesk"), "space-grotesk-latin-wght-normal.woff2"),
).toString("base64");
const mono = readFileSync(
  path.join(fontDir("jetbrains-mono"), "jetbrains-mono-latin-wght-normal.woff2"),
).toString("base64");

const stones: string[] = [];
if (!values["no-ring"]) {
  const cx = 905 * s + ox;
  const cy = 315 * s + oy;
  for (let slot = 0; slot < 8; slot++) {
    if (slot === GAP_INDEX) continue; // the open slot — open membership
    const p = slotPosition(slot);
    const rot = stoneRotation(RING_SEEDS[slot]);
    const pts = stonePoints("S", RING_SEEDS[slot])
      .map((pt) => `${(pt.x * STONE_SCALE).toFixed(2)},${(pt.y * STONE_SCALE).toFixed(2)}`)
      .join(" ");
    const x = cx - (RING_VIEWBOX / 2) * RING_SCALE + p.x * RING_SCALE;
    const y = cy - (RING_VIEWBOX / 2) * RING_SCALE + p.y * RING_SCALE;
    stones.push(
      `  <polygon transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${RING_SCALE.toFixed(3)}) rotate(${rot.toFixed(2)})" points="${pts}" fill="${slot === BLUE_INDEX ? C.accent : C.stone}"/>`,
    );
  }
}

const subsSvg = subs
  .map((line, i) => `  <text x="${X}" y="${(396 + 42 * i) * s + oy}" font-size="${30 * s}" fill="${C.body}">${esc(line)}</text>`)
  .join("\n");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <style>
    @font-face { font-family: "Space Grotesk Variable"; src: url(data:font/woff2;base64,${grotesk}) format("woff2"); font-weight: 300 700; }
    @font-face { font-family: "JetBrains Mono Variable"; src: url(data:font/woff2;base64,${mono}) format("woff2"); font-weight: 100 800; }
    text { font-family: "Space Grotesk Variable", system-ui, sans-serif; }
    .mono { font-family: "JetBrains Mono Variable", monospace; }
  </style>
  <rect width="${W}" height="${H}" fill="${C.ground}"/>
  <rect x="${40 * s}" y="${40 * s}" width="${W - 80 * s}" height="${H - 80 * s}" fill="none" stroke="${C.hairline}" stroke-width="1"/>
  <text x="${X}" y="${330 * s + oy}" font-size="${TITLE_SIZE * s}" font-weight="600" fill="${C.ink}">${esc(title)}</text>
${subsSvg}
  <text class="mono" x="${X}" y="${530 * s + oy}" font-size="${20 * s}" fill="${C.muted}">riprap.xyz</text>
${stones.join("\n")}
</svg>
`;

const htmlPath = path.join(tmp, "banner.html");
const pngPath = path.join(tmp, "banner.png");
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
  const svgPath = path.join(tmp, "banner.svg");
  writeFileSync(svgPath, svg);
  execFileSync("rsvg-convert", ["-w", String(W), "-h", String(H), "-o", pngPath, svgPath], {
    stdio: "pipe",
  });
}

execFileSync("magick", ["identify", pngPath], { stdio: "pipe" }); // fails unless rasterized
writeFileSync(outPath, readFileSync(pngPath));
console.log(`banner written: ${W}x${H} -> ${outPath}`);
