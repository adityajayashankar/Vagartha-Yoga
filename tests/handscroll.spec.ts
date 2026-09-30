import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function open(page: Page) {
  await page.goto("/");
  await expect(page.locator(".handscroll")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await page.evaluate(() => document.fonts.ready);
}
async function seek(page: Page, p: number) {
  await page.locator(".handscroll").evaluate((root, p) => {
    const stage = root.querySelector<HTMLElement>(".hs-stage")!;
    window.scrollTo(
      0,
      scrollY +
        root.getBoundingClientRect().top +
        p * ((root as HTMLElement).offsetHeight - stage.offsetHeight),
    );
  }, p);
  await expect
    .poll(async () =>
      Number(await page.locator(".handscroll").getAttribute("data-progress")),
    )
    .toBeCloseTo(p, 2);
}

test("camera, all five layer extents, continuous time and chapter centres", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  expect(
    await page
      .locator(".handscroll")
      .evaluate((el) => el.getBoundingClientRect().height),
  ).toBe(4500);
  expect(
    await page
      .locator(".hs-track")
      .evaluate((el) => el.getBoundingClientRect().width),
  ).toBe(5760);
  await page.mouse.move(1100, 450);
  await page.mouse.down(); // Hold native pointer input to prevent idle snap during sampling.
  for (const [p, time, word] of [
    [0, "05:50", "Awaken"],
    [0.33, "07:10", "Breathe"],
    [0.66, "10:30", "Flow"],
    [1, "19:30", "Rest"],
  ] as const) {
    await seek(page, p);
    await expect(page.locator("[data-clock]")).toHaveText(time);
    await expect(
      page.locator(`.hs-overlay [data-chapter]:not([aria-hidden]) .hs-word`),
    ).toHaveText(word);
    const layers = await page.locator("[data-layer]").evaluateAll((els) =>
      els.map((el) => {
        const node = el as HTMLElement;
        const box = node.getBoundingClientRect();
        return {
          speed: Number(node.dataset.speed),
          x: new DOMMatrix(getComputedStyle(node).transform).m41,
          left: box.left,
          right: box.right,
        };
      }),
    );
    for (const layer of layers) {
      expect(layer.x).toBeCloseTo(-p * 1440 * 3 * layer.speed, 0);
      expect(layer.left).toBeLessThanOrEqual(1);
      expect(layer.right).toBeGreaterThanOrEqual(1439);
    }
    expect(
      await page
        .locator(".hs-stage")
        .evaluate((el) => el.getBoundingClientRect().top),
    ).toBeCloseTo(0, 0);
  }
  await seek(page, 0.165);
  await expect(page.locator("[data-clock]")).toHaveText("06:30");
  const palette = await page
    .locator(".handscroll")
    .evaluate((el) =>
      [
        "--sky-top",
        "--sky-bottom",
        "--light-tint",
        "--shadow-tint",
        "--sun-y",
      ].map((name) => getComputedStyle(el).getPropertyValue(name)),
    );
  expect(palette[0]).toMatch(/rgba?\(202,\s?185,\s?165(?:,\s?1)?\)/);
  expect(parseFloat(palette[4])).toBeCloseTo(24.5, 1);
  await page.mouse.up();
});

for (const width of [360, 767, 768]) {
  test(`${width}px: responsive pin, portrait figure and layer coverage`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await open(page);
    expect(
      await page
        .locator(".hs-stage")
        .evaluate((el) => getComputedStyle(el).position),
    ).toBe("sticky");
    for (const [p, panel] of [
      [0, 0],
      [0.33, 1],
      [0.66, 2],
      [1, 3],
    ]) {
      await seek(page, p);
      if (width < 768) {
        await expect(page.locator(".hs-layer-foreground")).toBeHidden();
        const figure = await page
          .locator(".hs-figure-anchor")
          .nth(panel)
          .boundingBox();
        expect(
          Math.abs(figure!.x + figure!.width / 2 - width / 2),
        ).toBeLessThan(width * 0.04);
      } else await expect(page.locator(".hs-layer-foreground")).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(width);
    }
  });
}

test("low velocity snap settles, wheel and keyboard retain native scroll", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  await page.mouse.move(900, 500);
  await page.mouse.wheel(0, 1050);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(900);
  await expect(page.locator(".handscroll")).toHaveAttribute(
    "data-fast",
    "true",
  );
  await expect(page.locator(".handscroll")).toHaveAttribute(
    "data-fast",
    "false",
  );
  await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(1188, 0);
  await page.keyboard.press("PageDown");
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(1400);
  await page.keyboard.press("End");
  await expect(page.locator("footer")).toBeInViewport();
});

test("CSS breath clock has 4/6 timing, shared motion and offscreen pause", async ({
  page,
}) => {
  await open(page);
  await expect(page.locator(".handscroll")).toHaveAttribute(
    "data-ambient",
    "running",
  );
  const sharedClock = await page.locator(".hs-breath-clock").evaluateAll((elements) => elements.map((el) => Number(getComputedStyle(el).getPropertyValue("--breath"))));
  for (const value of sharedClock) expect(value).toBeCloseTo(sharedClock[0], 3);
  const samples = await page.locator(".hs-ring").evaluate(async (stage) => {
    const animation = stage
      .getAnimations()
      .find((a) => (a as CSSAnimation).animationName === "hs-breath-clock")!;
    const duration = animation.effect!.getTiming().duration;
    animation.pause();
    const values = [];
    for (const time of [0, 2000, 4000, 7000, 10000]) {
      animation.currentTime = time;
      await new Promise(requestAnimationFrame);
      values.push(Number(getComputedStyle(stage).getPropertyValue("--breath")));
    }
    animation.play();
    return { duration, values };
  });
  expect(samples.duration).toBe(10000);
  expect(samples.values[0]).toBeCloseTo(0);
  expect(samples.values[1]).toBeCloseTo(0.5, 1);
  expect(samples.values[2]).toBeCloseTo(1);
  expect(samples.values[3]).toBeCloseTo(0.5, 1);
  expect(samples.values[4]).toBeCloseTo(0);
  const cloud = () =>
    page.locator(".hs-cloud").evaluate((el) => getComputedStyle(el).transform);
  const before = await cloud();
  await page.waitForTimeout(1100);
  expect(await cloud()).not.toBe(before);
  await page.locator(".nav-book").click();
  await expect(page.locator(".handscroll")).toHaveAttribute(
    "data-ambient",
    "paused",
  );
  const stopped = await cloud();
  await page.waitForTimeout(300);
  expect(await cloud()).toBe(stopped);
});

test("visibility lifecycle pauses and resumes the shared CSS clock (controlled event)", async ({
  page,
}) => {
  await open(page);
  await expect(page.locator(".handscroll")).toHaveAttribute(
    "data-ambient",
    "running",
  );
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator(".handscroll")).toHaveAttribute(
    "data-ambient",
    "paused",
  );
  await page.evaluate(() => {
    delete (document as unknown as { hidden?: boolean }).hidden;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator(".handscroll")).toHaveAttribute(
    "data-ambient",
    "running",
  );
});

test("reduced motion stacks all four server poses and survives live preference changes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  for (const preference of ["reduce", "no-preference", "reduce"] as const) {
    await page.emulateMedia({ reducedMotion: preference });
    if (preference === "no-preference") {
      await seek(page, 0.66);
      continue;
    }
    await expect
      .poll(() =>
        page
          .locator(".hs-stage")
          .evaluate((el) => getComputedStyle(el).position),
      )
      .toBe("relative");
    expect(
      await page
        .locator(".handscroll")
        .evaluate((el) => el.getBoundingClientRect().height),
    ).toBe(844 * 4);
    const boxes = await page.locator(".hs-panel").evaluateAll((els) =>
      els.map((el) => ({
        top: el.getBoundingClientRect().top,
        height: el.getBoundingClientRect().height,
      })),
    );
    for (let i = 1; i < boxes.length; i++)
      expect(boxes[i].top - boxes[i - 1].top).toBe(844);
    await expect(page.locator(".hs-overlay")).toBeHidden();
    await expect(page.locator(".handscroll")).toHaveAttribute(
      "data-ambient",
      "paused",
    );
    expect(
      await page
        .locator("[data-rig]")
        .nth(1)
        .locator('[data-joint="upperArmL"]')
        .getAttribute("transform"),
    ).toBe("rotate(163)");
  }
});

test("first scene and all static chapters exist without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto(test.info().project.use.baseURL + "/");
  await expect(page.locator(".hs-rig").first()).toBeInViewport();
  await expect(page.locator(".hs-static-ui .hs-word").first()).toBeVisible();
  await expect(page.locator(".hs-static-ui .hs-word")).toHaveText([
    "Awaken",
    "Breathe",
    "Flow",
    "Rest",
  ]);
  await expect(page.locator(".handscroll filter")).toHaveCount(0);
  await context.close();
});

test("rig/art budgets, eleven joints, real interpolation and no layout shift", async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as unknown as { heroCLS: number }).heroCLS = 0;
    new PerformanceObserver((list) =>
      list.getEntries().forEach((entry) => {
        const shift = entry as PerformanceEntry & {
          hadRecentInput: boolean;
          value: number;
        };
        if (!shift.hadRecentInput)
          (window as unknown as { heroCLS: number }).heroCLS += shift.value;
      }),
    ).observe({ type: "layout-shift", buffered: true });
  });
  await open(page);
  const bytes = await page.locator(".handscroll").evaluate((el) => ({
    rig: new TextEncoder().encode(el.querySelector("[data-rig]")!.outerHTML)
      .length,
    art: new TextEncoder().encode(
      [...el.querySelectorAll("svg")].map((svg) => svg.outerHTML).join(""),
    ).length,
  }));
  expect(bytes.rig).toBeLessThan(3000);
  expect(bytes.art + 2285).toBeLessThan(250000);
  await expect(
    page.locator("[data-rig]").first().locator("[data-joint]"),
  ).toHaveCount(11);
  const arm = page
    .locator("[data-rig]")
    .first()
    .locator('[data-joint="upperArmL"]');
  const first = await arm.getAttribute("transform");
  await page.mouse.move(900, 400);
  await page.mouse.down();
  await seek(page, 0.08);
  const intermediate = await arm.getAttribute("transform");
  expect(intermediate).not.toBe(first);
  expect(intermediate).not.toBe("rotate(163.000)");
  await page.mouse.up();
  expect(
    await page.evaluate(
      () => (window as unknown as { heroCLS: number }).heroCLS,
    ),
  ).toBe(0);
});

test("native touch scroll advances the mobile camera", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await open(page);
  const cdp = await context.newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 190, y: 650 }],
  });
  for (const y of [580, 500, 400, 300, 200]) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: 190, y }],
    });
    await page.waitForTimeout(30);
  }
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(200);
  await expect
    .poll(async () =>
      Number(await page.locator(".handscroll").getAttribute("data-progress")),
    )
    .toBeGreaterThan(0.04);
  await context.close();
});

test("hero WCAG AA at each daylight key", async ({ page }) => {
  await open(page);
  for (const p of [0, 0.33, 0.66, 1]) {
    await seek(page, p);
    await page.waitForTimeout(750);
    const result = await new AxeBuilder({ page })
      .include(".handscroll")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(result.violations).toEqual([]);
  }
});
