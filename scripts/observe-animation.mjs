// Real-time visual QA: retain a recording plus four observations of every idle.
// Run against the local preview: node scripts/observe-animation.mjs
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";

const output = "artifacts/animation-observation";
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  recordVideo: { dir: output, size: { width: 1440, height: 1000 } },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await page.goto(process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000");
await page.waitForFunction(() => document.querySelector(".pin-spacer"));
await page.evaluate(() => document.fonts.ready);
const start = await page
  .locator(".pin-spacer")
  .evaluate((el) => el.getBoundingClientRect().top + scrollY - 104);
const observations = [];
for (let stage = 0; stage < 5; stage++) {
  await page.evaluate(
    (y) => scrollTo({ top: y, behavior: "instant" }),
    start + Math.min(1599, stage * 400),
  );
  await page.waitForTimeout(900);
  const world = page.locator(".day-window [data-world]");
  const frames = [];
  for (const [index, wait] of [0, 3000, 3000, 4000].entries()) {
    await page.waitForTimeout(wait);
    const image = await world.screenshot();
    await writeFile(`${output}/stage-${stage}-${index}.png`, image);
    frames.push(await sharp(image).resize(410, 256).toBuffer());
    observations.push(
      await world.evaluate((el) => ({
        stage: el.getAttribute("data-progress"),
        lift: el.getAttribute("data-lift"),
        frame: el.getAttribute("data-frame"),
      })),
    );
  }
  await sharp({
    create: { width: 1640, height: 256, channels: 4, background: "#faf7f2" },
  })
    .composite(frames.map((input, i) => ({ input, left: i * 410, top: 0 })))
    .png()
    .toFile(`${output}/idle-${stage}.png`);
  console.log(`Observed stage ${stage} for 10 seconds`);
}
// Slowly reverse and then advance through every intermediate pose and sunset.
for (const direction of [-1, 1]) {
  for (let i = 0; i <= 100; i++) {
    const progress = direction < 0 ? 1 - i / 100 : i / 100;
    await page.evaluate(
      (y) => scrollTo({ top: y, behavior: "instant" }),
      start + progress * 1599,
    );
    await page.waitForTimeout(100);
  }
}
for (const selector of ["#sessions", "#about", "footer"]) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  await page.waitForTimeout(5500);
  await page.screenshot({ path: `${output}/${selector.replace("#", "")}.png` });
}
await writeFile(
  `${output}/observations.json`,
  JSON.stringify({ errors, observations }, null, 2),
);
const video = page.video();
await context.close();
await video.saveAs(`${output}/journey.webm`);
await browser.close();
if (errors.length) throw new Error(errors.join("\n"));
console.log(`Recording and observations saved in ${output}`);
