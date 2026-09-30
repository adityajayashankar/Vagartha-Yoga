import { practiceOptions, type Enquiry } from "./enquiry";

export async function sendEnquiry(data: Enquiry, idempotencyKey: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ENQUIRY_FROM;
  if (!apiKey || !from) return { ok: false, status: 503 } as const;

  const practice = practiceOptions.find(
    (option) => option.value === data.practice,
  )!.label;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `enquiry/${idempotencyKey}`,
      },
      body: JSON.stringify({
        from,
        to: ["vagarthayoga@gmail.com"],
        reply_to: data.email,
        subject: `Vagartha Yoga enquiry: ${practice}`,
        text: [
          `Name: ${data.name}`,
          `Reply to: ${data.email}`,
          `Practice: ${practice}`,
          `City / time zone: ${data.timezone || "Not supplied"}`,
          "",
          data.message,
        ].join("\n"),
      }),
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    if (!response.ok) return { ok: false, status: 502 } as const;
    const result = await response.json();
    return typeof result.id === "string" && result.id.length > 0
      ? ({ ok: true, status: 200 } as const)
      : ({ ok: false, status: 502 } as const);
  } catch {
    // Do not log personal messages, API keys, or provider response bodies.
    return { ok: false, status: 502 } as const;
  }
}
