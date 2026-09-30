import { validateEnquiry, type Enquiry } from "@/lib/enquiry";
import { sendEnquiry } from "@/lib/send-enquiry";

export const runtime = "nodejs";
export const maxDuration = 20;

const MAX_BODY_BYTES = 16384;
const response = (body: object, status: number) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

function allowedOrigins() {
  const origins = new Set([
    "https://vagarthayoga.com",
    "https://www.vagarthayoga.com",
  ]);
  for (const value of [
    process.env.SITE_URL,
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
    process.env.DEPLOY_PRIME_URL,
  ]) {
    if (value) {
      try {
        const url = new URL(value);
        if (url.protocol === "https:") origins.add(url.origin);
      } catch {
        /* Invalid configuration grants no origin. */
      }
    }
  }
  if (
    process.env.NODE_ENV !== "production" ||
    process.env.ALLOW_LOCAL_ENQUIRY === "true"
  ) {
    origins.add("http://localhost:3000");
    origins.add("http://localhost:3100");
    origins.add("http://127.0.0.1:3100");
  }
  return origins;
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (
    !origin ||
    !allowedOrigins().has(origin) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    return response(
      { ok: false, error: "This form must be sent from the Vagartha website." },
      403,
    );
  if (
    request.headers.get("content-type")?.split(";")[0].trim() !==
    "application/json"
  )
    return response(
      { ok: false, error: "Use the enquiry form to send your message." },
      415,
    );
  const idempotencyKey = request.headers.get("idempotency-key") ?? "";
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      idempotencyKey,
    )
  )
    return response(
      { ok: false, error: "Please reload the page and try again." },
      400,
    );
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES)
    return response({ ok: false, error: "Please shorten your message." }, 413);

  let input: Record<string, unknown>;
  try {
    // Read with a real bound, including requests without Content-Length.
    const reader = request.body?.getReader();
    if (!reader)
      return response({ ok: false, error: "Your message is missing." }, 400);
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        await reader.cancel();
        return response(
          { ok: false, error: "Please shorten your message." },
          413,
        );
      }
      chunks.push(value);
    }
    const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return response({ ok: false, error: "Please check your message." }, 400);
    input = parsed as Record<string, unknown>;
  } catch {
    return response({ ok: false, error: "Please check your message." }, 400);
  }
  if (typeof input.website !== "string" || input.website.trim())
    return response(
      { ok: false, error: "Please try again, or email Girija." },
      400,
    );
  const keys = ["name", "email", "practice", "timezone", "message"] as const;
  if (keys.some((key) => typeof input[key] !== "string"))
    return response(
      { ok: false, error: "Please complete the enquiry form." },
      400,
    );
  const data = Object.fromEntries(
    keys.map((key) => [key, (input[key] as string).trim()]),
  ) as Enquiry;
  const errors = validateEnquiry(data);
  if (Object.keys(errors).length) return response({ ok: false, errors }, 400);

  const result = await sendEnquiry(data, idempotencyKey);
  return result.ok
    ? response({ ok: true }, 200)
    : response(
        {
          ok: false,
          error:
            "We couldn’t confirm delivery. Please try again or email Girija.",
        },
        result.status,
      );
}
