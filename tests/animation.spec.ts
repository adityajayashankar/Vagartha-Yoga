import { test, expect } from "@playwright/test";

for (const reducedMotion of ["reduce", "no-preference"] as const) {
  test(`motion: ${reducedMotion}, native anchors and offscreen pause`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto("/");
    expect(await page.locator(".pin-spacer, canvas").count()).toBe(0);
    await page.locator(".nav-book").click();
    await expect(page.locator("#contact-heading")).toBeInViewport();
    expect(
      await page.evaluate(
        () => getComputedStyle(document.documentElement).scrollBehavior,
      ),
    ).toBe("auto");
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document
              .getAnimations()
              .filter((animation) => animation.playState === "running").length,
        ),
      )
      .toBe(0);
    if (reducedMotion === "reduce") {
      expect(
        await page
          .locator(".hs-rig-breath")
          .first()
          .evaluate((el) => getComputedStyle(el).transitionDuration),
      ).toBe("0s");
    }
  });
}

test("mobile navigation responds to a click with a short transform/opacity reveal", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation", exact: true }),
  ).toBeVisible();
  const timing = await page.locator(".mobile-nav").evaluate((el) => ({
    duration: getComputedStyle(el).animationDuration,
    easing: getComputedStyle(el).animationTimingFunction,
  }));
  expect(timing.duration).toBe("0.2s");
  expect(timing.easing).toContain("cubic-bezier");
});
