import { test, expect } from "@playwright/test";
import { POST } from "../src/app/api/enquiry/route";

const valid = {
  name: "Test Visitor",
  email: "visitor@example.com",
  practice: "regular",
  timezone: "Asia/Kolkata",
  message: "Please tell me about the classes.",
  website: "",
};
const originalFetch = globalThis.fetch;
const originalKey = process.env.RESEND_API_KEY;
const originalFrom = process.env.ENQUIRY_FROM;
let sent: {
  body: Record<string, unknown>;
  headers: Record<string, string>;
} | null = null;
function request(
  body: unknown = valid,
  origin = "https://vagarthayoga.com",
  contentType = "application/json",
) {
  return new Request("https://vagarthayoga.com/api/enquiry", {
    method: "POST",
    headers: {
      origin,
      "content-type": contentType,
      "Idempotency-Key": "16b41c7c-c769-4cc4-909b-ae81dceebc84",
    },
    body: JSON.stringify(body),
  });
}
test.beforeEach(() => {
  sent = null;
  process.env.RESEND_API_KEY = "test-only-placeholder";
  process.env.ENQUIRY_FROM = "Vagartha Yoga <website@vagarthayoga.com>";
  globalThis.fetch = async (_url, init) => {
    sent = {
      body: JSON.parse(String(init?.body)),
      headers: init?.headers as Record<string, string>,
    };
    return Response.json({ id: "controlled-provider-acceptance" });
  };
});
test.afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = originalKey;
  if (originalFrom === undefined) delete process.env.ENQUIRY_FROM;
  else process.env.ENQUIRY_FROM = originalFrom;
});

test("validated request sends only to Girija with visitor reply-to", async () => {
  const result = await POST(request());
  expect(result.status).toBe(200);
  expect(await result.json()).toEqual({ ok: true });
  expect(sent!.body.to).toEqual(["vagarthayoga@gmail.com"]);
  expect(sent!.body.reply_to).toBe("visitor@example.com");
  expect(sent!.body.text).toContain("Asia/Kolkata");
  expect(sent!.headers["Idempotency-Key"]).toContain("16b41c7c");
});

for (const [name, body] of [
  ["empty form", {}],
  ["bad email", { ...valid, email: "invalid" }],
  [
    "header injection",
    { ...valid, email: "name@example.com\r\nBcc:x@evil.example" },
  ],
  ["unknown practice", { ...valid, practice: "other" }],
  ["honeypot", { ...valid, website: "https://spam.example" }],
  ["too short", { ...valid, message: "hi" }],
  ["too long", { ...valid, message: "a".repeat(3001) }],
  ["non-string field", { ...valid, name: 42 }],
] as const) {
  test(`rejects ${name} before sending email`, async () => {
    expect((await POST(request(body))).status).toBe(400);
    expect(sent).toBeNull();
  });
}

test("rejects cross-site, missing origin, foreign content type and oversized input", async () => {
  expect((await POST(request(valid, "https://unrelated.example"))).status).toBe(
    403,
  );
  expect((await POST(request(valid, ""))).status).toBe(403);
  expect(
    (await POST(request(valid, "https://vagarthayoga.com", "text/plain")))
      .status,
  ).toBe(415);
  expect(
    (await POST(request({ ...valid, message: "x".repeat(17000) }))).status,
  ).toBe(413);
  expect(sent).toBeNull();
});

test("missing provider configuration reports failure, never simulated success", async () => {
  delete process.env.RESEND_API_KEY;
  const result = await POST(request());
  expect(result.status).toBe(503);
  expect((await result.json()).ok).toBe(false);
  expect(sent).toBeNull();
});

test("provider rejection, malformed success, and network errors report failure", async () => {
  for (const mode of ["rejection", "malformed", "network"]) {
    globalThis.fetch = async () => {
      if (mode === "network") throw new Error("controlled network failure");
      if (mode === "rejection")
        return Response.json(
          { error: "controlled rejection" },
          { status: 429 },
        );
      return Response.json({ unexpected: true });
    };
    const result = await POST(request());
    expect(result.status).toBe(502);
    expect((await result.json()).ok).toBe(false);
  }
});
