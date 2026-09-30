import sharp from "sharp";
import { writeFile } from "node:fs/promises";

// Bake once, never ship a live SVG filter. Regenerate: node scripts/bake-handscroll-grain.mjs
const source =
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><filter id="g"><feTurbulence type="fractalNoise" baseFrequency=".72" numOctaves="3" seed="17" stitchTiles="stitch"/></filter><rect width="64" height="64" filter="url(#g)"/></svg>';
const png = await sharp(Buffer.from(source))
  .grayscale()
  .png({ palette: true, colours: 16 })
  .toBuffer();
await writeFile(
  new URL("../src/components/handscroll/grain.ts", import.meta.url),
  `// Generated from a stitched feTurbulence tile; no runtime filter.\nexport const GRAIN_TILE = "data:image/png;base64,${png.toString("base64")}";\n`,
);
console.log(`Baked 64 x 64 grain: ${png.length} bytes`);
