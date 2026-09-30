import {
  breeze,
  starlight,
  birdFlight,
  lampFlicker,
} from "./animation/environment";
import { breath, blink, chain, characterPose } from "./animation/character";
/** Code-authored pixel scenery. No bitmap, SVG image, or network asset is used. */
export type WorldMode = "hero" | "journey" | "moment" | "vignette" | "footer";
export type WorldMotion = {
  progress: number;
  entrance: number;
  invitation: number;
};
export type Layer =
  "sky" | "landscape" | "architecture" | "life" | "foreground" | "atmosphere";
export const layers: Layer[] = [
  "sky",
  "landscape",
  "architecture",
  "life",
  "foreground",
  "atmosphere",
];
type Ctx = CanvasRenderingContext2D;
type Point = [number, number];
type Palette = {
  sky: string;
  horizon: string;
  hill: string;
  near: string;
  stone: string;
  edge: string;
  foliage: string;
  leaf: string;
  light: string;
  night: number;
};
export type Frame = {
  width: number;
  height: number;
  time: number;
  mode: WorldMode;
  scene: number;
  motion: WorldMotion;
  reduced: boolean;
  showCharacter?: boolean;
  levitation?: number;
};

const swatches = [
  [
    "#b7b8d4",
    "#f3dbd1",
    "#b1a7c6",
    "#8b8caa",
    "#c3aea9",
    "#9d8591",
    "#697b77",
    "#a4b79e",
    "#f2dfc6",
  ],
  [
    "#d8d4e2",
    "#f9e0bf",
    "#b5b4c7",
    "#879a98",
    "#dfc6ab",
    "#b99d99",
    "#647f70",
    "#b3be8d",
    "#ffe3ae",
  ],
  [
    "#d6e6e6",
    "#f6e9d6",
    "#b0c5c3",
    "#739a89",
    "#e5d0b5",
    "#b9a292",
    "#54735f",
    "#b3bf84",
    "#ffefc5",
  ],
  [
    "#bc9aba",
    "#f6bf99",
    "#b291ac",
    "#89778e",
    "#d4a392",
    "#a17a82",
    "#6e7066",
    "#afaa7f",
    "#ffd394",
  ],
  [
    "#272943",
    "#766381",
    "#65617e",
    "#454b67",
    "#777083",
    "#50495f",
    "#3d5056",
    "#798b83",
    "#eee0bd",
  ],
];

export const clamp = (v: number, lo = 0, hi = 1) =>
  Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const smooth = (v: number) => {
  const p = clamp(v);
  return p * p * (3 - 2 * p);
};
const noise = (n: number) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
function mix(a: string, b: string, p: number) {
  const ac = parseInt(a.slice(1), 16),
    bc = parseInt(b.slice(1), 16);
  const r = Math.round(lerp(ac >> 16, bc >> 16, p));
  const g = Math.round(lerp((ac >> 8) & 255, (bc >> 8) & 255, p));
  const bl = Math.round(lerp(ac & 255, bc & 255, p));
  return `rgb(${r},${g},${bl})`;
}
function palette(progress: number): Palette {
  const t = clamp(progress) * 4,
    i = Math.min(3, Math.floor(t));
  const c = swatches[i].map((v, n) => mix(v, swatches[i + 1][n], t - i));
  return {
    sky: c[0],
    horizon: c[1],
    hill: c[2],
    near: c[3],
    stone: c[4],
    edge: c[5],
    foliage: c[6],
    leaf: c[7],
    light: c[8],
    night: smooth((progress - 0.73) / 0.27),
  };
}
function rect(
  c: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
function poly(c: Ctx, points: Point[], color: string) {
  c.fillStyle = color;
  c.beginPath();
  points.forEach(([x, y], i) =>
    i
      ? c.lineTo(Math.round(x), Math.round(y))
      : c.moveTo(Math.round(x), Math.round(y)),
  );
  c.closePath();
  c.fill();
}
function ellipse(
  c: Ctx,
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: string,
) {
  // Scanlines preserve authored square edges, even for round foliage and faces.
  for (let yy = -Math.floor(ry); yy <= ry; yy += 2) {
    const half = rx * Math.sqrt(Math.max(0, 1 - (yy * yy) / (ry * ry)));
    rect(c, x - half, y + yy, half * 2, 2, color);
  }
}
function line(c: Ctx, a: Point, b: Point, width: number, color: string) {
  const count = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
  for (let i = 0; i <= count; i += 1) {
    const t = count ? i / count : 0;
    rect(
      c,
      lerp(a[0], b[0], t) - width / 2,
      lerp(a[1], b[1], t) - width / 2,
      width,
      width,
      color,
    );
  }
}

function cloud(c: Ctx, x: number, y: number, size: number, opacity: number) {
  c.globalAlpha = opacity;
  for (let i = 0; i < 5; i++) {
    const offset = noise(i + size) * 15;
    rect(c, x + i * size * 0.13, y - offset, size * 0.3, 4 + offset, "#fff4e4");
    rect(c, x + i * size * 0.13 + 8, y + 4, size * 0.22, 3, "#f6dfdc");
  }
  c.globalAlpha = 1;
}

function sky(c: Ctx, f: Frame, p: Palette, day: number, camera: number) {
  const { width: w, height: h, time: t } = f;
  const grad = c.createLinearGradient(0, 0, 0, h * 0.75);
  grad.addColorStop(0, p.sky);
  grad.addColorStop(0.78, p.horizon);
  grad.addColorStop(1, p.light);
  c.fillStyle = grad;
  c.fillRect(0, 0, w, h);
  // Fine dither gives the atmospheric gradient a pixel texture, not a vector finish.
  c.globalAlpha = 0.12;
  for (let i = 0; i < 1150; i++)
    rect(
      c,
      noise(i * 3) * w,
      noise(i + 30) * h * 0.76,
      1,
      1,
      i % 2 ? "#fff5e9" : "#938497",
    );
  c.globalAlpha = 1;
  const sunX = w * 0.74 - camera * 0.035;
  const dawn = 1 - smooth(day / 0.18);
  const sunlight = (1 - p.night) * (1 - dawn);
  const sunY =
    h *
    (0.32 -
      Math.sin(day * Math.PI * 1.12) * 0.23 +
      smooth((day - 0.65) * 4) * 0.43);
  c.globalAlpha = sunlight;
  for (let i = 5; i > 0; i--) {
    c.globalAlpha = sunlight * 0.025;
    ellipse(c, sunX, sunY, 20 + i * 10, 20 + i * 10, "#ffecbf");
  }
  c.globalAlpha = sunlight;
  ellipse(c, sunX, sunY, 20, 20, "#fff0c6");
  rect(c, sunX - 15, sunY - 12, 23, 2, "#fff7df");
  c.globalAlpha = Math.max(p.night, dawn * 0.65);
  const my =
    h * (0.2 + (1 - dawn) * 0.06 - p.night * 0.06) + Math.sin(t * 0.035) * 0.5;
  ellipse(c, w * 0.79, my, 17, 17, "#e9dec9");
  ellipse(c, w * 0.79 + 8, my - 5, 16, 16, p.sky);
  for (let i = 0; i < 65; i++) {
    c.globalAlpha = starlight(day, t, noise(i + 77));
    rect(
      c,
      noise(i + 12) * w,
      noise(i + 320) * h * 0.46,
      i % 9 ? 1 : 2,
      1,
      "#fff1d6",
    );
  }
  c.globalAlpha = 1;
  for (let i = 0; i < 7; i++) {
    const x =
      ((((i * 167 + t * (1 + (i % 3)) - camera * 0.06) % (w + 220)) + w + 220) %
        (w + 220)) -
      130;
    cloud(
      c,
      x,
      h * (0.1 + noise(i + 6) * 0.3),
      60 + noise(i + 5) * 100,
      0.25 * (1 - p.night * 0.55),
    );
  }
}

function landscape(c: Ctx, f: Frame, p: Palette, camera: number) {
  const { width: w, height: h, time: t } = f;
  for (let layer = 0; layer < 4; layer++) {
    const base = h * (0.4 + layer * 0.072),
      speed = 0.1 + layer * 0.08;
    const points: Point[] = [[-4, h]];
    for (let x = -4; x <= w + 4; x += 4) {
      const q = x + camera * speed;
      const y =
        base +
        Math.sin(q * 0.009 + layer * 1.9) * 26 +
        Math.sin(q * 0.022 + layer * 4) * 11 +
        noise(Math.floor(q / 6) + layer) * 5;
      points.push([x, y]);
    }
    points.push([w + 4, h]);
    c.globalAlpha = 0.5 + layer * 0.13;
    poly(c, points, layer < 2 ? p.hill : p.near);
    if (layer > 1)
      for (let i = 0; i < 120; i++) {
        const x = (((i * 13 - camera * speed) % (w + 30)) + w + 30) % (w + 30);
        const y = base + 38 + noise(i) * 37;
        poly(
          c,
          [
            [x, y],
            [x + 3, y - 8 - noise(i + 19) * 13],
            [x + 6, y],
          ],
          p.foliage,
        );
      }
  }
  c.globalAlpha = 1;
  // Lake surface and discrete animated reflected-light pixels.
  rect(c, 0, h * 0.62, w, h * 0.15, p.hill);
  for (let i = 0; i < 140; i++) {
    const y = h * 0.63 + noise(i + 81) * h * 0.135;
    const x =
      (noise(i + 401) * (w + 40) +
        Math.sin(t * 0.4 + i) * 5 -
        camera * 0.12 +
        w * 3) %
      (w + 40);
    c.globalAlpha = 0.12 + noise(i) * 0.2;
    rect(c, x, y, 4 + noise(i + 2) * 19, 1, p.light);
  }
  c.globalAlpha = 0.13 * (1 - p.night);
  cloud(
    c,
    w * 0.1 + Math.sin(t * 0.06) * 10,
    h * 0.52,
    w * 0.7,
    0.14 * (1 - p.night),
  );
  c.globalAlpha = 1;
}

function planter(
  c: Ctx,
  x: number,
  y: number,
  scale: number,
  t: number,
  p: Palette,
  seed: number,
  flowers = false,
) {
  c.save();
  c.translate(Math.round(x), Math.round(y));
  c.scale(scale, scale);
  ellipse(c, 0, 4, 25, 6, "#40354722");
  poly(
    c,
    [
      [-20, -27],
      [21, -27],
      [15, 1],
      [-13, 1],
    ],
    "#a47870",
  );
  poly(
    c,
    [
      [-15, -24],
      [3, -24],
      [0, -1],
      [-9, -1],
    ],
    "#c79a82",
  );
  rect(c, -22, -29, 45, 6, "#d5af95");
  rect(c, -20, -23, 41, 2, "#876977");
  rect(c, -10, -12, 23, 2, "#d2a489");
  rect(c, -8, -7, 18, 1, "#d2a489");
  for (let b = 0; b < 9; b++) {
    const angle = -0.95 + b * 0.235,
      length = 26 + noise(b + seed) * 36;
    const sway = breeze(t, seed, b) * (0.8 + (b % 3) * 0.35);
    const end: Point = [
      Math.sin(angle) * length + sway,
      -28 - Math.cos(angle) * length,
    ];
    line(c, [0, -27], end, 1, p.foliage);
    for (let l = 1; l < 5; l++) {
      const k = l / 5,
        xx = end[0] * k,
        yy = -27 + (end[1] + 27) * k;
      const side = l % 2 ? 1 : -1;
      const flutter = breeze(t - l * 0.23, seed + l, b) * 0.7;
      poly(
        c,
        [
          [xx, yy],
          [xx + side * 10, yy - 9 + flutter],
          [xx + side * 13, yy - 7 + flutter],
          [xx + side * 7, yy - 1],
        ],
        l % 2 ? p.leaf : p.foliage,
      );
      rect(c, xx + side * 5, yy - 5, 3, 1, "#d4d0a766");
    }
    if (flowers) {
      ellipse(c, end[0], end[1], 5, 4, b % 2 ? "#e8bac8" : "#f1e2cd");
      rect(c, end[0], end[1], 2, 2, "#b99169");
    }
  }
  c.restore();
}

function tree(
  c: Ctx,
  x: number,
  y: number,
  scale: number,
  t: number,
  p: Palette,
  seed: number,
) {
  c.save();
  c.translate(Math.round(x), Math.round(y));
  c.scale(scale, scale);
  poly(
    c,
    [
      [-12, 0],
      [-8, -90],
      [5, -145],
      [13, -147],
      [4, -76],
      [8, 0],
    ],
    "#79636a",
  );
  poly(
    c,
    [
      [-7, 0],
      [-5, -85],
      [9, -139],
      [10, -110],
      [1, -64],
      [-1, 0],
    ],
    "#a68b7b",
  );
  for (let b = 0; b < 8; b++) {
    const side = b % 2 ? 1 : -1,
      by = -64 - b * 10;
    line(c, [0, by + 30], [side * (28 + b * 4), by - 12], 4, "#79636a");
  }
  // Dense, overlapping masses establish the canopy; smaller leaves articulate its edges.
  for (let i = 0; i < 19; i++) {
    const angle = noise(i + seed + 800) * Math.PI * 2;
    const radius = Math.sqrt(noise(i + seed + 870));
    const dx = Math.cos(angle) * radius * 66;
    const dy = Math.sin(angle) * radius * 38;
    ellipse(
      c,
      dx + breeze(t, seed, i) * 0.65,
      -143 + dy,
      26 + noise(i + 42) * 8,
      17 + noise(i + 17) * 7,
      i % 3 ? p.foliage : p.leaf,
    );
  }
  // Individual leaf clusters have different wind phases; trunk stays grounded.
  for (let i = 0; i < 650; i++) {
    const a = noise(i + seed) * Math.PI * 2,
      radius = Math.sqrt(noise(i + seed + 90));
    const dx = Math.cos(a) * radius * 88,
      dy = Math.sin(a) * radius * 53;
    const leafMotion = breeze(t, seed, i % 19) * 1.2 * radius;
    const shade = noise(i * 6 + seed);
    const color = shade < 0.4 ? p.foliage : shade < 0.9 ? p.leaf : "#c1c49b";
    rect(
      c,
      dx + leafMotion,
      -143 + dy,
      2 + noise(i + 8) * 4,
      2 + noise(i + 4) * 3,
      color,
    );
    if (i % 17 === 0) rect(c, dx + leafMotion, -145 + dy, 2, 2, "#e9d5b3");
  }
  c.restore();
}

function pavilion(
  c: Ctx,
  x: number,
  y: number,
  scale: number,
  t: number,
  p: Palette,
) {
  c.save();
  c.translate(Math.round(x), Math.round(y));
  c.scale(scale, scale);
  const color = p.stone;
  // Open colonnade, stepped cornice, relief details, and individually moving curtains.
  rect(c, -130, -183, 260, 10, color);
  rect(c, -141, -192, 282, 6, p.edge);
  rect(c, -135, -188, 270, 7, color);
  rect(c, -145, -196, 290, 4, p.light);
  for (const xx of [-111, 111]) {
    rect(c, xx - 9, -173, 18, 167, color);
    rect(c, xx + 5, -173, 4, 167, p.edge);
    rect(c, xx - 6, -166, 2, 152, p.light);
    rect(c, xx - 15, -180, 30, 9, color);
    rect(c, xx - 15, -173, 30, 2, p.edge);
    rect(c, xx - 16, -9, 32, 9, color);
    rect(c, xx - 19, 0, 38, 4, p.edge);
    for (let yy = -159; yy < -10; yy += 24) rect(c, xx - 7, yy, 12, 1, p.edge);
  }
  for (let xx = -96; xx <= 96; xx += 12) {
    rect(c, xx, -181, 5, 3, p.edge);
    rect(c, xx + 1, -189, 2, 2, p.light);
  }
  for (const side of [-1, 1]) {
    const base = side * 88;
    for (let row = 0; row < 64; row++) {
      const y1 = -171 + row * 2;
      const drift = Math.sin(t * 0.8 + row * 0.06) * 4 * (row / 64);
      c.globalAlpha = 0.67;
      rect(
        c,
        base + drift - 8,
        y1,
        17 + Math.sin(row * 0.025) * 6,
        2,
        "#f4e3cd",
      );
      rect(c, base + drift + 1, y1, 2, 2, "#c8b2ac");
    }
  }
  c.globalAlpha = 1;
  // Flowering vine across the roof.
  for (let i = 0; i < 115; i++) {
    const xx = noise(i + 21) * 268 - 134,
      yy = -205 + noise(i + 100) * 27;
    rect(
      c,
      xx + Math.sin(t * 0.5 + i) * 1.2,
      yy,
      5,
      3,
      i % 3 ? p.foliage : p.leaf,
    );
    if (i % 6 === 0) rect(c, xx + 2, yy - 1, 3, 3, "#edcfca");
  }
  c.restore();
}

function terrace(c: Ctx, f: Frame, p: Palette, camera: number) {
  const { width: w, height: h } = f,
    ground = h * 0.79;
  // A continuous terrace, not scene panels. Tile seams travel at ground speed.
  rect(c, 0, ground, w, h - ground, p.stone);
  for (let row = 0; row < 7; row++) {
    const yy = ground + row * row * 2.6,
      tileW = 35 + row * 15,
      offset = (camera + ((row % 2) * tileW) / 2) % tileW;
    rect(c, 0, yy, w, 1, p.edge);
    for (let xx = -tileW; xx < w + tileW; xx += tileW) {
      const x = xx - offset;
      line(c, [x, yy], [x - 6, yy + 3 + row * 5.4], 1, p.edge);
      rect(c, x + 5, yy + 3, tileW * 0.5, 1, p.light);
    }
  }
  for (let i = 0; i < 500; i++) {
    const x = (noise(i) * (w + 20) - camera + w * 10) % (w + 20);
    const y = ground + noise(i + 18) * (h - ground);
    c.globalAlpha = 0.2;
    rect(c, x, y, 1 + noise(i + 62) * 4, 1, i % 2 ? p.light : p.edge);
  }
  c.globalAlpha = 1;
  const railY = ground - 29,
    offset = (camera * 0.72) % 32;
  rect(c, 0, railY - 41, w, 5, p.stone);
  rect(c, 0, railY - 42, w, 2, p.light);
  for (let x = -32; x < w + 32; x += 32) {
    const q = x - offset;
    rect(c, q, railY - 35, 6, 31, p.stone);
    rect(c, q + 4, railY - 35, 2, 31, p.edge);
    rect(c, q - 2, railY - 30, 10, 5, p.stone);
    rect(c, q - 1, railY - 11, 8, 5, p.stone);
  }
  rect(c, 0, railY, w, 6, p.edge);
  rect(c, 0, railY, w, 2, p.light);
}

function mat(
  c: Ctx,
  x: number,
  y: number,
  width: number,
  roll: number,
  p: Palette,
  phase: number,
) {
  const size = width * lerp(0.16, 1, clamp(roll));
  poly(
    c,
    [
      [x - width / 2, y],
      [x - width / 2 + size, y],
      [x - width / 2 + size + 13, y + 17],
      [x - width / 2 - 13, y + 17],
    ],
    "#ad8294",
  );
  rect(c, x - width / 2 - 11, y + 17, size + 22, 3, "#8d6b84");
  for (let i = 0; i < 7; i++)
    line(
      c,
      [x - width / 2 - i, y + i * 2 + 2],
      [x - width / 2 + size + i, y + i * 2 + 2],
      1,
      i % 2 ? "#c799a7" : "#bd94a1",
    );
  if (roll < 0.98) {
    const rx = x - width / 2 + size;
    rect(c, rx - 3, y - 6, 8, 23, "#c29aa7");
    ellipse(c, rx + 1, y - 5, 5, 4, "#e1bbc0");
    rect(c, rx, y - 7, 2, 3, "#8f687f");
  }
  c.globalAlpha = 0.08 + Math.sin(phase) * 0.02;
  rect(c, x - width / 2, y + 6, size, 1, p.light);
  c.globalAlpha = 1;
}

function tea(c: Ctx, x: number, y: number, t: number, p: Palette) {
  ellipse(c, x, y + 2, 14, 3, p.edge);
  rect(c, x - 8, y - 11, 16, 12, "#e4cfb6");
  rect(c, x - 6, y - 9, 2, 8, "#f6e3c6");
  rect(c, x + 8, y - 9, 5, 2, "#e4cfb6");
  rect(c, x + 12, y - 8, 2, 5, "#e4cfb6");
  rect(c, x + 8, y - 4, 5, 2, "#e4cfb6");
  ellipse(c, x, y - 11, 7, 2, "#836d67");
  for (let k = 0; k < 3; k++)
    for (let j = 0; j < 16; j++) {
      const rise = (t * 8 + j + k * 11) % 32;
      c.globalAlpha = 0.28 * (1 - rise / 32);
      rect(
        c,
        x + k * 3 - 3 + Math.sin(rise * 0.19 + t + k) * 3,
        y - 15 - rise,
        1,
        2,
        "#fff1dc",
      );
    }
  c.globalAlpha = 1;
}

function lantern(
  c: Ctx,
  x: number,
  y: number,
  night: number,
  t: number,
  emphasis: number,
) {
  const brightness = clamp(night + emphasis * 0.6),
    flicker = lampFlicker(t);
  for (let i = 4; i > 0; i--) {
    c.globalAlpha = brightness * 0.028 * flicker;
    ellipse(c, x, y - 17, 8 + i * 9 + emphasis * 8, 15 + i * 8, "#ffd19a");
  }
  c.globalAlpha = 1;
  rect(c, x - 7, y - 28, 14, 25, "#77616c");
  rect(c, x - 5, y - 25, 10, 18, "#c1a084");
  c.globalAlpha = brightness * flicker;
  rect(c, x - 4, y - 24, 8, 16, "#ffdf9f");
  rect(c, x - 2, y - 20, 4, 10, "#fff1c6");
  c.globalAlpha = 1;
  rect(c, x - 1, y - 26, 2, 21, "#76606c");
  rect(c, x - 9, y - 5, 18, 4, "#655165");
  rect(c, x - 9, y - 30, 18, 3, "#655165");
  line(c, [x - 3, y - 31], [x - 3, y - 35], 1, "#655165");
  line(c, [x - 3, y - 35], [x + 3, y - 35], 1, "#655165");
  line(c, [x + 3, y - 35], [x + 3, y - 31], 1, "#655165");
}

function props(
  c: Ctx,
  x: number,
  y: number,
  t: number,
  p: Palette,
  stage: number,
  emphasis: number,
) {
  tea(c, x + 96, y + 5, t, p);
  // Bolster, folded blanket, yoga blocks, and strap have their own geometry.
  ellipse(c, x - 102, y + 4, 22, 7, "#987b90");
  rect(c, x - 121, y - 4, 37, 8, "#b899a8");
  ellipse(c, x - 120, y, 5, 7, "#cfb0b8");
  rect(c, x - 117, y - 5, 2, 11, "#97798e");
  rect(c, x - 86, y + 8, 22, 8, "#b99f88");
  rect(c, x - 86, y + 8, 22, 2, "#e4c7a4");
  rect(c, x - 68, y + 10, 4, 6, "#967d7d");
  line(c, [x - 90, y + 20], [x - 63, y + 22], 2, "#e1cdbc");
  line(c, [x - 90, y + 20], [x - 87, y + 17], 2, "#e1cdbc");
  const screenPresence = smooth(1 - Math.abs(stage - 1));
  if (screenPresence > 0) {
    c.globalAlpha = screenPresence;
    poly(
      c,
      [
        [x + 61, y],
        [x + 84, y],
        [x + 88, y - 30],
        [x + 67, y - 30],
      ],
      "#655d70",
    );
    rect(c, x + 69, y - 27, 15, 21, "#d3cec5");
    ellipse(c, x + 77, y - 22, 3, 4, "#ad8070");
    rect(c, x + 72, y - 17, 10, 9, "#8b9e87");
    rect(c, x + 59, y + 1, 29, 3, "#797181");
  }
  c.globalAlpha = 1;
  lantern(
    c,
    x + 135,
    y + 3,
    Math.max(p.night, (1 - smooth(stage / 0.7)) * 0.45),
    t,
    emphasis,
  );
}

function limb(c: Ctx, points: Point[], width: number, cloth = false) {
  const shadow = cloth ? "#bda999" : "#9f695a",
    base = cloth ? "#e3d3b9" : "#c38e70",
    light = cloth ? "#f3e5ca" : "#e2b28c";
  for (let i = 0; i < points.length - 1; i++) {
    line(c, points[i], points[i + 1], width + 2, shadow);
    line(
      c,
      [points[i][0] - 1, points[i][1] - 1],
      [points[i + 1][0] - 1, points[i + 1][1] - 1],
      width,
      base,
    );
    line(
      c,
      [points[i][0] - width / 4, points[i][1] - 1],
      [points[i + 1][0] - width / 4, points[i + 1][1] - 1],
      Math.max(2, width / 4),
      light,
    );
  }
}

/** Articulated pixel character: the head, chest, hair, cloth, arms and legs are separate parts. */
function character(
  c: Ctx,
  x: number,
  y: number,
  scale: number,
  t: number,
  state: number,
  floating: number,
) {
  // Character poses advance at ten authored frames per second, independently
  // of the environment clock and GSAP's smooth scroll/camera updates.
  t = Math.floor(t * 10) / 10;
  const rig = characterPose(state, t);
  const weights = Array.from({ length: 5 }, (_, i) =>
    smooth(1 - Math.abs(state - i)),
  );
  const breathe = -breath(t) * 1.6;
  const practice = breath(t / 1.6);
  const slouch = 1 + rig.transfer * 0.7;
  const lean = weights[2] * practice * 0.055;
  c.save();
  c.translate(Math.round(x), Math.round(y));
  c.scale(scale, scale);
  c.globalAlpha = 0.15 + (1 - floating) * 0.12;
  ellipse(c, 0, 8, 55 - floating * 12, 7 - floating * 2, "#4a344f");
  c.globalAlpha = 1;
  const lift = floating * 10;
  c.translate(0, -lift);
  const hipY = rig.hip[1];
  // One opaque pair of legs in every frame, including crouch and foot placement.
  for (const [index, leg] of [rig.left, rig.right].entries()) {
    limb(c, leg, 17, true);
    const foot = leg[2];
    limb(
      c,
      [
        foot,
        [
          foot[0] + (index ? -1 : 1) * lerp(21, 9, smooth((-hipY - 15) / 48)),
          foot[1] + 1,
        ],
      ],
      6,
    );
    line(
      c,
      [leg[1][0] - 4, leg[1][1] - 3],
      [leg[1][0] + 4, leg[1][1] - 2 + rig.transfer],
      1,
      "#cbb7a5",
    );
  }
  // The waist joins both thighs; no transparent replacement geometry.
  ellipse(c, rig.hip[0], hipY + 2, 20, 10, "#e3d3b9");
  c.save();
  c.translate(rig.hip[0], hipY);
  c.rotate(lean);
  c.translate(0, breathe);
  // Bare waist and tailored top, with breathing expansion and moving hem.
  poly(
    c,
    [
      [-15, -15],
      [15, -15],
      [19, 3],
      [-19, 3],
    ],
    "#c58f72",
  );
  poly(
    c,
    [
      [-18, -61 + slouch],
      [-11, -65 + slouch],
      [10, -65 + slouch],
      [19, -60 + slouch],
      [16 + breathe * 0.25, -35],
      [17, -10],
      [-17, -10],
      [-15 - breathe * 0.25, -34],
    ],
    "#ad798a",
  );
  poly(
    c,
    [
      [-15, -59 + slouch],
      [-10, -62 + slouch],
      [-5, -40],
      [-9, -11],
      [-17, -11],
    ],
    "#c7919a",
  );
  poly(
    c,
    [
      [10, -60 + slouch],
      [18, -58 + slouch],
      [14, -34],
      [17, -11],
      [9, -11],
    ],
    "#8f667e",
  );
  poly(
    c,
    [
      [-11, -65 + slouch],
      [-8, -49 + slouch * 0.4],
      [0, -45 + slouch * 0.4],
      [9, -49 + slouch * 0.4],
      [11, -65 + slouch],
    ],
    "#c88f73",
  );
  line(c, [-9, -26], [12, -28 + Math.sin(t) * 0.7], 1, "#d49faa");
  line(
    c,
    [-13, -15],
    [12, -14 + Math.sin(t * 0.8) * 0.5 + rig.transfer + floating * 0.5],
    2,
    "#ba8995",
  );
  // Arms follow shoulders, then elbows, then hands. Resting hands stay on knees.
  const resting = (side: number): Point => [side * 43, -9 - hipY - breathe];
  const opening = breath(Math.max(0, t - 0.18));
  const stretch = breath(Math.max(0, t - 0.35) / 1.6);
  const armState = rig.arms;
  const armWeights = Array.from({ length: 4 }, (_, i) =>
    smooth(1 - Math.abs(armState - i)),
  );
  if (state > 2) {
    const releaseStretch = 1 - smooth((state - 2) / 0.22);
    const prayer = (1 - releaseStretch) * smooth(armState / 3);
    armWeights.splice(
      0,
      4,
      1 - releaseStretch - prayer,
      0,
      releaseStretch,
      prayer,
    );
  }
  for (const side of [-1, 1]) {
    const targets: Point[] = [
      resting(side),
      [side * (43 + opening * 13), -9 - hipY - opening * 29],
      side < 0 ? [-48, -9 - hipY] : [12 - stretch * 29, -99 - stretch * 10],
      [side * 3, -48],
    ];
    const target: Point = [0, 0];
    targets.forEach((point, i) => {
      target[0] += point[0] * armWeights[i];
      target[1] += point[1] * armWeights[i];
    });
    const shoulder: Point = [
      side * (18 - breathe * 0.12),
      -57 + breathe * 0.22,
    ];
    const arm = chain(shoulder, target, 33, 35, -side);
    limb(c, arm, 7);
    const hand = arm[2];
    ellipse(c, hand[0], hand[1], 5, 3, "#d9a281");
    rect(c, hand[0] - 3, hand[1] - 2, 5, 1, "#e8b992");
    const finger = Math.sin(t * 0.71 + side) > 0.93 ? 1 : 0;
    rect(c, hand[0] + side * 3, hand[1] + finger, 2, 2, "#bd846d");
  }
  // Neck and softly inclined head, independently breathing and nodding.
  rect(c, -5, -76 + slouch, 10, 15, "#b77f68");
  rect(c, -3, -73 + slouch, 6, 9, "#d3a080");
  c.save();
  c.translate(0, -88 + slouch + Math.sin(t * 0.45) * 0.45);
  c.rotate(Math.sin(t * 0.35) * 0.012 - rig.transfer * 0.018);
  ellipse(c, 0, -7, 17, 22, "#44363e");
  ellipse(c, 3, -28, 10, 8, "#48383e");
  ellipse(c, 0, -3, 13, 20, "#ae7663");
  ellipse(c, -1, -5, 12, 19, "#cf9777");
  poly(
    c,
    [
      [-10, -16],
      [-4, -22],
      [2, -18],
      [10, -15],
      [11, -3],
      [7, 7],
      [2, 13],
      [-5, 11],
      [-11, 2],
    ],
    "#d7a282",
  );
  poly(
    c,
    [
      [7, -12],
      [11, -7],
      [10, 4],
      [4, 13],
      [1, 11],
      [6, 4],
    ],
    "#bd846d",
  );
  line(c, [-8, -3], [-3, -2], 1, "#62414a");
  line(c, [3, -2], [8, -3], 1, "#62414a");
  if (!blink(t)) {
    // Downcast eyes: just one extra pixel, retaining the meditative expression.
    rect(c, -6, -2, 2, 1, "#45343c");
    rect(c, 5, -2, 2, 1, "#45343c");
  }
  rect(c, 0, 1, 2, 4, "#e5b490");
  rect(c, -2, 8, 5, 1, "#a66966");
  rect(c, -1, 9, 3, 1, "#e1a68b");
  poly(
    c,
    [
      [-16, -15],
      [-11, -25],
      [-2, -28],
      [11, -23],
      [16, -11],
      [12, -3],
      [10, -14],
      [1, -21],
      [-5, -16],
      [-10, -10],
      [-11, 4],
      [-16, -2],
    ],
    "#45343c",
  );
  for (let i = 0; i < 11; i++)
    line(
      c,
      [-12 + i * 2, -22 + Math.sin(i) * 3],
      [-14 + i * 2, -12 + Math.sin(i) * 4],
      1,
      i % 2 ? "#65504b" : "#554048",
    );
  for (const side of [-1, 1]) {
    const sway =
      Math.sin(t * 1.31 + side) * 0.8 + rig.transfer * 1.5 + floating * 0.6;
    line(c, [side * 13, -9], [side * 16 + sway, 4], 2, "#4c3941");
    line(c, [side * 16 + sway, 4], [side * 13 + sway, 13], 1, "#665048");
    rect(c, side * 13, 0, 2, 3, "#e4c091");
  }
  c.restore();
  c.restore();
  c.restore();
}

function actors(c: Ctx, f: Frame, p: Palette) {
  const { width: w, height: h, time: t, mode, motion } = f;
  const floor = h * 0.81;
  const hero = mode === "hero",
    footer = mode === "footer";
  const state =
    hero || footer ? 4 : mode === "journey" ? motion.progress * 4 : f.scene;
  const x = w * (footer ? 0.76 : 0.53);
  const scale = footer ? 0.4 : hero ? 1.11 : 1.04;
  const floating = f.reduced ? 0 : (f.levitation ?? 0);
  const roll = footer
    ? lerp(0.9, 0.15, motion.entrance) + motion.invitation * 0.2
    : 1;
  const day = hero ? 0.12 : footer ? 1 : state / 4;
  const stretch = 0.4 + Math.abs(0.5 - day) * 2.5;
  const shadowDirection = Math.cos(day * Math.PI);
  c.globalAlpha = 0.12;
  poly(
    c,
    [
      [x - 25, floor + 3],
      [x + 35, floor + 3],
      [x + 35 + stretch * 20 * shadowDirection, floor + 18],
      [x - 25 + stretch * 15 * shadowDirection, floor + 18],
    ],
    "#5c4461",
  );
  c.globalAlpha = 1;
  mat(c, x, floor + 2, footer ? 65 : 145, roll, p, t);
  if (f.showCharacter !== false) {
    character(c, x, floor - 7, scale, t, state, floating);
    c.globalAlpha = 1;
  }
  c.save();
  c.translate(x, floor + 13);
  const propScale = footer ? 0.46 : Math.min(0.8, w / 520);
  c.scale(propScale, propScale);
  props(c, 0, 0, t, p, state, motion.invitation);
  c.restore();
  if (footer) {
    ellipse(c, x - 48, floor + 1, 12, 4, "#b293ab");
    line(c, [x + 30, floor + 7], [x + 34, floor - 5], 1, "#b9a397");
    for (let j = 0; j < 12; j++) {
      c.globalAlpha = (1 - j / 12) * 0.22;
      rect(
        c,
        x + 34 + Math.sin(j * 0.3 + t * 0.7) * 2,
        floor - 7 - j,
        1,
        1,
        "#ddc8d5",
      );
    }
    c.globalAlpha = 1;
  }
}

function architecture(c: Ctx, f: Frame, p: Palette, camera: number) {
  const { width: w, height: h, mode, time: t } = f;
  terrace(c, f, p, camera);
  if (mode === "journey") {
    const px = w * 1.3 - camera * 0.8;
    if (px > -220 && px < w + 220) pavilion(c, px, h * 0.795, 1.15, t, p);
    // The rose practice path runs continuously beneath every chapter.
    for (let x = -4; x < w + 4; x += 4) {
      const y = h * 0.92 + Math.sin((x + camera) * 0.007) * 10;
      rect(c, x, y, 4, 10, "#bd91a4");
      rect(c, x, y + 1, 4, 1, "#dbb5be");
      rect(c, x, y + 8, 4, 1, "#98768f");
    }
  } else if ((mode === "moment" || mode === "vignette") && f.scene === 2)
    pavilion(c, w * 0.53, h * 0.79, 0.95, t, p);
  const spacing = w * 0.9;
  const count = mode === "journey" ? 3 : 2;
  for (let i = 0; i < count; i++) {
    const x =
      mode === "journey"
        ? i * spacing - camera * 0.75
        : i
          ? w * 0.98
          : w * 0.06;
    if (x < -120 || x > w + 120) continue;
    tree(
      c,
      x,
      h * 0.765,
      mode === "footer" ? 0.45 : 0.85 + (i % 2) * 0.15,
      t,
      p,
      i * 67 + 4,
    );
  }
}

function foreground(c: Ctx, f: Frame, p: Palette, camera: number) {
  const { width: w, height: h, mode, time: t } = f;
  if (mode === "journey") {
    for (let i = 0; i < 5; i++) {
      const x = i * w * 0.72 - camera * 1.03;
      if (x < -90 || x > w + 90) continue;
      // Low planting keeps the guide's pose clear as the foreground passes.
      planter(c, x, h * 0.99, 0.6 + (i % 3) * 0.08, t, p, i * 13, i % 2 === 0);
    }
  } else {
    planter(
      c,
      w * 0.94,
      h * 0.89,
      mode === "footer" ? 0.42 : 0.85,
      t,
      p,
      19,
      true,
    );
    planter(c, w * 0.06, h * 0.88, 0.9, t, p, 6, false);
  }
  // Close leaves sit on a distinct, faster-moving layer.
  for (let i = 0; i < 25; i++) {
    const x = ((i * 39 - camera * 1.2 + w * 10) % (w + 60)) - 30;
    if (x > w * 0.22 && x < w * 0.84) continue;
    const y = h - 4 + noise(i) * 12;
    const sway = Math.sin(t * 0.55 + i) * 3;
    line(c, [x, h + 10], [x + sway, y - 14], 2, p.foliage);
    poly(
      c,
      [
        [x + sway, y - 9],
        [x - 9 + sway, y - 18],
        [x - 4 + sway, y - 21],
        [x + sway + 2, y - 13],
      ],
      p.leaf,
    );
  }
}

function atmosphere(c: Ctx, f: Frame, p: Palette, camera: number) {
  const { width: w, height: h, time: t, mode } = f;
  for (let i = 0; i < 15; i++) {
    const speed = 1.5 + noise(i) * 3;
    const x =
      (((noise(i + 51) * w - t * speed - camera * 1.3) % (w + 20)) + w + 20) %
      (w + 20);
    const y =
      h * 0.25 + ((noise(i + 22) * h * 0.6 + t * speed * 0.3) % (h * 0.65));
    c.globalAlpha = 0.35 * (1 - p.night * 0.5);
    poly(
      c,
      [
        [x, y],
        [x + 4, y - 1],
        [x + 6, y + 1 + Math.sin(t + i)],
        [x + 2, y + 3],
      ],
      "#e9bcc8",
    );
  }
  if (p.night < 0.6)
    for (let i = 0; i < 3; i++) {
      const bird = birdFlight(t, w, i);
      if (!bird) continue;
      const x = bird.x - camera * 0.015;
      const y = h * 0.24 + Math.sin(t * 0.45 + i) * 3 + i * 7;
      c.globalAlpha = 0.4 * (1 - p.night);
      line(c, [x - 4, y - bird.wing], [x, y], 1, p.foliage);
      line(c, [x, y], [x + 4, y - bird.wing], 1, p.foliage);
    }
  for (let i = 0; i < 15; i++) {
    const x = noise(i + 840) * w + Math.sin(t * 0.35 + i) * 9;
    const y = h * 0.56 + noise(i + 31) * h * 0.32 + Math.cos(t * 0.4 + i) * 5;
    c.globalAlpha = p.night * (0.35 + Math.sin(t * 1.2 + i) * 0.3);
    rect(c, x, y, 2, 2, "#f9d697");
    rect(c, x - 2, y - 2, 5, 5, "#f9d69722");
  }
  if (mode === "footer" && f.motion.invitation > 0.05) {
    const q = (t * 0.28) % 1;
    c.globalAlpha = Math.sin(q * Math.PI) * f.motion.invitation * 0.8;
    ellipse(c, w * (0.74 + q * 0.08), h * (0.78 - q * 0.56), 4, 3, "#ffe4b4");
  }
  c.globalAlpha = 1;
}

export function paint(layer: Layer, c: Ctx, frame: Frame) {
  const f = frame.reduced ? { ...frame, time: 0 } : frame;
  const day =
    f.mode === "journey"
      ? f.motion.progress
      : f.mode === "hero"
        ? 0.12 + f.motion.progress * 0.13
        : f.mode === "footer"
          ? 0.88 + f.motion.entrance * 0.12
          : f.scene / 4;
  const p = palette(day),
    camera = f.mode === "journey" ? f.motion.progress * f.width * 0.9 : 0;
  c.clearRect(0, 0, f.width, f.height);
  c.imageSmoothingEnabled = false;
  switch (layer) {
    case "sky":
      sky(c, f, p, day, camera);
      break;
    case "landscape":
      landscape(c, f, p, camera);
      break;
    case "architecture":
      architecture(c, f, p, camera);
      break;
    case "life":
      actors(c, f, p);
      break;
    case "foreground":
      foreground(c, f, p, camera);
      break;
    case "atmosphere":
      atmosphere(c, f, p, camera);
      break;
  }
}
