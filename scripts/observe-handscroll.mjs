import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const output = "artifacts/handscroll";
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const report = {
  environment:
    "Local headless Chromium; mobile emulation is not a physical Android benchmark",
  scenes: [],
  performance: [],
};
for (const [name, width, height] of [
  ["desktop", 1440, 900],
  ["mobile", 390, 844],
]) {
  const context = await browser.newContext({
    viewport: { width, height },
    recordVideo: { dir: output, size: { width, height } },
  });
  const page = await context.newPage();
  await page.goto(baseURL);
  await page.locator('[data-ready="true"]').waitFor();
  await page.evaluate(() => document.fonts.ready);
  const clock = [];
  for (let i = 0; i < 3; i++) {
    await page.screenshot({ path: `${output}/${name}-breath-${i}.png` });
    clock.push(
      await page
        .locator(".hs-stage")
        .evaluate((el) => ({
          breath: getComputedStyle(el.querySelector(".hs-ring")).getPropertyValue("--breath"),
          cloud: getComputedStyle(el.querySelector(".hs-cloud")).transform,
        })),
    );
    if (i < 2) await page.waitForTimeout(2000);
  }
  for (const p of [0, 0.33, 0.66, 1]) {
    await page
      .locator(".handscroll")
      .evaluate(
        (el, p) =>
          window.scrollTo(
            0,
            el.getBoundingClientRect().top +
              scrollY +
              p *
                (el.offsetHeight - el.querySelector(".hs-stage").offsetHeight),
          ),
        p,
      );
    await page.waitForTimeout(1600);
    await page.screenshot({ path: `${output}/${name}-${p}.png` });
  }
  report.scenes.push({ name, clock, video: await page.video().path() });
  if (name === "mobile") {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${output}/reduced-motion.png`, fullPage: true });
  }
  await context.close();
}
// Isolated from both video encoding and the test runner; still not device proof.
for (const [name, width, height, cpuThrottle] of [["desktop", 1440, 900, 1], ["mobile", 390, 844, 1], ["mobile-throttled", 390, 844, 4]]) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  await page.goto(baseURL);
  await page.locator('[data-ready="true"]').waitFor();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpuThrottle });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1600);
  const frames = await page.evaluate(async () => {
    const root = document.querySelector(".handscroll");
    const start = root.getBoundingClientRect().top + scrollY;
    const distance =
      root.offsetHeight - root.querySelector(".hs-stage").offsetHeight;
    const deltas = [];
    await new Promise((resolve) => {
      let previous, began;
      function tick(now) {
        began ??= now;
        if (previous) deltas.push(now - previous);
        previous = now;
        const p = Math.min(1, (now - began) / 5000);
        window.scrollTo(0, start + p * distance);
        if (p < 1) requestAnimationFrame(tick);
        else resolve();
      }
      requestAnimationFrame(tick);
    });
    deltas.sort((a, b) => a - b);
    return {
      samples: deltas.length,
      medianMs: deltas[Math.floor(deltas.length / 2)],
      p95Ms: deltas[Math.floor(deltas.length * 0.95)],
      over34ms: deltas.filter((ms) => ms > 34).length,
    };
  });
  report.performance.push({ name, cpuThrottle, frames });
  await context.close();
}
await browser.close();
await writeFile(`${output}/observation.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
