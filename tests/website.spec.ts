import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const [width, height] of [
  [1920, 1080],
  [1440, 900],
  [1280, 800],
  [1024, 768],
  [768, 1024],
  [430, 932],
  [390, 844],
  [375, 812],
  [360, 800],
]) {
  test(`${width}px: layout, navigation, images and anchors`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (/Content Security Policy|Refused to/.test(message.text()))
        errors.push(message.text());
    });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator(".hs-stage")).toBeVisible();
    await expect(page.locator(".hs-rig").first()).toBeVisible();
    await page.screenshot({ path: `artifacts/qa-${width}-hero.png` });
    expect(
      await page
        .locator('a[href^="#"]')
        .evaluateAll((links) =>
          links
            .filter(
              (link) =>
                document.querySelectorAll(link.getAttribute("href")!).length !==
                1,
            )
            .map((link) => link.getAttribute("href")),
        ),
    ).toEqual([]);
    for (const id of ["sessions", "approach", "about", "contact"]) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await page.screenshot({ path: `artifacts/qa-${width}-form.png` });
    if (width <= 900) {
      await page.getByRole("button", { name: "Open navigation" }).click();
      await page.keyboard.press("Escape");
      await expect(
        page.getByRole("button", { name: "Open navigation" }),
      ).toBeFocused();
      await page.getByRole("button", { name: "Open navigation" }).click();
      await page
        .getByRole("navigation", { name: "Mobile navigation", exact: true })
        .getByRole("link", { name: "The practice" })
        .click();
      await expect(
        page.getByRole("navigation", {
          name: "Mobile navigation",
          exact: true,
        }),
      ).toHaveCount(0);
    } else {
      await page
        .getByRole("navigation", { name: "Main navigation", exact: true })
        .getByRole("link", { name: "The practice" })
        .click();
    }
    await expect(page.locator("#sessions-heading")).toBeInViewport();
    expect(
      await page
        .locator("#sessions")
        .evaluate((el) => el.getBoundingClientRect().top),
    ).toBeGreaterThanOrEqual(80);
    expect(errors).toEqual([]);
  });
}

test("practice details preserve enquiry topic and keyboard operation", async ({
  page,
}) => {
  await page.goto("/");
  for (const id of ["regular", "prenatal", "postnatal"]) {
    const details = page.locator(`#session-${id} details`);
    await details.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(details).toHaveAttribute("open", "");
    await details.getByRole("link").click();
    await expect(
      page.getByLabel("What would you like to talk about?"),
    ).toHaveValue(id);
    await details.locator("summary").click();
    await expect(details).not.toHaveAttribute("open", "");
  }
  expect(await page.locator('a[href^="tel:"]').count()).toBe(0);
});

for (const width of [1440, 360]) {
  test(`WCAG 2.2 AA checks at ${width}px including open disclosures and errors`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    for (const summary of await page.locator("summary").all())
      await summary.click();
    await page.getByRole("button", { name: "Send to Girija" }).click();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(result.violations).toEqual([]);
  });
}

test("skip link and visible keyboard focus", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  expect(
    await page
      .getByRole("link", { name: "Skip to content" })
      .evaluate((el) => getComputedStyle(el).outlineStyle),
  ).not.toBe("none");
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeInViewport();
});

test("privacy and custom 404 have metadata, accessible content and email route", async ({
  page,
}) => {
  await page.goto("/privacy");
  await expect(page).toHaveTitle("Your enquiry and privacy | Vagartha Yoga");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://vagarthayoga.com/privacy",
  );
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
  const response = await page.goto("/page-that-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "isn’t here",
  );
  await expect(
    page.getByRole("link", { name: "Email Girija" }),
  ).toHaveAttribute("href", "mailto:vagarthayoga@gmail.com");
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
});

test("direct contact fragments land below the header", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/#contact");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator("#contact-heading")).toBeInViewport();
});

test("security, canonical, social metadata, sitemap and robots", async ({
  page,
  request,
}) => {
  const response = await page.goto("/");
  const headers = response!.headers();
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["content-security-policy"]).toContain("'strict-dynamic'");
  expect(headers["content-security-policy"]).not.toContain(
    "script-src 'self' 'unsafe-inline'",
  );
  const nonce = headers["content-security-policy"].match(/nonce-([^']+)/)![1];
  const next = await request.get("/");
  expect(next.headers()["content-security-policy"]).not.toContain(nonce);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://vagarthayoga.com",
  );
  await expect(
    page.locator('meta[property="og:image"]').first(),
  ).toHaveAttribute("content", "https://vagarthayoga.com/social-card.png");
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );
  expect(
    JSON.parse(
      (await page
        .locator('script[type="application/ld+json"]')
        .textContent()) ?? "{}",
    )["@type"],
  ).toBe("Organization");
  expect((await request.get("/sitemap.xml")).status()).toBe(200);
  expect(await (await request.get("/robots.txt")).text()).toContain(
    "https://vagarthayoga.com/sitemap.xml",
  );
  for (const path of [
    "/favicon.ico",
    "/apple-touch-icon.png",
    "/social-card.png",
  ])
    expect((await request.get(path)).status()).toBe(200);
  const redirect = await request.get("/test?hello=world", {
    headers: { Host: "www.vagarthayoga.com" },
    maxRedirects: 0,
  });
  expect(redirect.status()).toBe(308);
  expect(redirect.headers().location).toBe(
    "https://vagarthayoga.com/test?hello=world",
  );
});
