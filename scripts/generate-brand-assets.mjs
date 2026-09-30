import fs from "node:fs/promises";
import sharp from "sharp";

await fs.mkdir("public", { recursive: true });
const icon = await fs.readFile("src/app/icon.svg");
await sharp(icon).resize(180, 180).png().toFile("public/apple-touch-icon.png");
const png = await sharp(icon).resize(32, 32).png().toBuffer();
const header = Buffer.alloc(22);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header[6] = 32;
header[7] = 32;
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(png.length, 14);
header.writeUInt32LE(22, 18);
await fs.writeFile("public/favicon.ico", Buffer.concat([header, png]));
const social = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#f6f3ea"/>
<rect x="820" width="380" height="630" fill="#263d32"/>
<path d="M1010 355c-115-52-70-163 0-220 70 57 115 168 0 220zm0 0c-117 8-166-82-157-142 84 0 142 60 157 142zm0 0c117 8 166-82 157-142-84 0-142 60-157 142zM915 398h190" fill="none" stroke="#f6f3ea" stroke-width="3"/>
<text x="72" y="103" font-family="Arial,sans-serif" font-size="15" fill="#8b4935" letter-spacing="4">PERSONAL YOGA, TAUGHT ONLINE</text>
<text x="68" y="269" font-family="Georgia,serif" font-size="115" fill="#263d32">Vagartha</text>
<text x="75" y="333" font-family="Arial,sans-serif" font-size="25" fill="#263d32" letter-spacing="14">YOGA</text>
<path d="M72 401h670" stroke="#d8d4c7"/>
<text x="72" y="461" font-family="Arial,sans-serif" font-size="23" fill="#263d32">One-to-one with Girija Jayashankar.</text>
<text x="72" y="559" font-family="Arial,sans-serif" font-size="17" fill="#596258">vagarthayoga.com</text>
</svg>`;
await sharp(Buffer.from(social)).png().toFile("public/social-card.png");
console.log("Generated favicon, Apple touch icon and social card.");
