import { test, expect } from "@playwright/test";

test("hero stage reserves space and fonts are served from this origin", async ({
  page,
}) => {
  const fontOrigins: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "font")
      fontOrigins.push(new URL(request.url()).origin);
  });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const bounds = await page.locator(".hs-stage").boundingBox();
  expect(bounds!.height).toBe(page.viewportSize()!.height);
  expect(fontOrigins.length).toBeGreaterThan(0);
  expect(
    fontOrigins.every((origin) => origin === new URL(page.url()).origin),
  ).toBe(true);
  await expect(page.locator(".handscroll svg filter")).toHaveCount(0);
  await expect(page.locator(".hs-rig")).toHaveCount(4);
});

test("form validation focuses the first error", async ({ page }) => {
  await page.goto("/#contact");
  await page.getByRole("button", { name: "Send to Girija" }).click();
  await expect(page.getByLabel("Your name", { exact: true })).toBeFocused();
  await expect(page.locator("#name-error")).toBeVisible();
  await page.getByLabel("Your name", { exact: true }).fill("Test visitor");
  await page.getByLabel("Email address", { exact: true }).fill("invalid");
  await page.getByRole("button", { name: "Send to Girija" }).click();
  await expect(page.getByLabel("Email address", { exact: true })).toBeFocused();
});

test("form success is conditional on accepted submission and pending prevents duplicates", async ({
  page,
}) => {
  let calls = 0;
  await page.route("**/api/enquiry", async (route) => {
    calls++;
    expect(route.request().postDataJSON().email).toBe("visitor@example.com");
    await new Promise((resolve) => setTimeout(resolve, 200));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });
  await page.goto("/#contact");
  await page.getByLabel("Your name", { exact: true }).fill("Test visitor");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("visitor@example.com");
  await page
    .getByLabel("Your message", { exact: true })
    .fill("I would like to ask about a class.");
  await page.getByRole("button", { name: "Send to Girija" }).click();
  await expect(
    page.getByRole("button", { name: "Sending your message…" }),
  ).toBeDisabled();
  await expect(page.getByText("Your message is on its way.")).toBeVisible();
  await expect(page.getByLabel("Your name", { exact: true })).toHaveValue("");
  expect(calls).toBe(1);
});

test("network failure preserves message, mailto fallback and retry identity", async ({
  page,
}) => {
  const keys: string[] = [];
  await page.route("**/api/enquiry", (route) => {
    keys.push(route.request().headers()["idempotency-key"]);
    return route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ ok: false }),
    });
  });
  await page.goto("/#contact");
  await page.getByLabel("Your name", { exact: true }).fill("Test visitor");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("visitor@example.com");
  await page
    .getByLabel("Your message", { exact: true })
    .fill("Is there time to discuss regular yoga?");
  await page.getByRole("button", { name: "Send to Girija" }).click();
  await expect(page.locator(".enquiry-form").getByRole("alert")).toBeVisible();
  await expect(page.getByLabel("Your message", { exact: true })).toHaveValue(
    "Is there time to discuss regular yoga?",
  );
  const mailto = await page
    .getByRole("link", { name: "Send this message by email" })
    .getAttribute("href");
  expect(decodeURIComponent(mailto!)).toContain(
    "mailto:vagarthayoga@gmail.com",
  );
  expect(decodeURIComponent(mailto!)).toContain(
    "Is there time to discuss regular yoga?",
  );
  await page.getByRole("button", { name: "Send to Girija" }).click();
  await expect(page.locator(".enquiry-form").getByRole("alert")).toBeVisible();
  expect(keys).toHaveLength(2);
  expect(keys[0]).toBe(keys[1]);
});

test("without JavaScript the email fallback is usable", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(test.info().project.use.baseURL + "/#contact");
  await expect(
    page.getByRole("link", {
      name: "email vagarthayoga@gmail.com",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Send to Girija" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("link", { name: "Write to Girija directly." }),
  ).toHaveAttribute("href", /^mailto:vagarthayoga@gmail.com/);
  await context.close();
});
