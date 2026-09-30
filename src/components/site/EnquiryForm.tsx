"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import { ArrowRight } from "lucide-react";
import {
  enquiryMailto,
  practiceOptions,
  validateEnquiry,
  type Enquiry,
  type FieldErrors,
} from "@/lib/enquiry";

export default function EnquiryForm() {
  const ready = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const form = useRef<HTMLFormElement>(null);
  const statusBox = useRef<HTMLDivElement>(null);
  const attempt = useRef<{ body: string; id: string } | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [feedback, setFeedback] = useState("");
  const [fallback, setFallback] = useState(enquiryMailto());

  useEffect(() => {
    const choosePractice = (event: MouseEvent) => {
      const link = (event.target as HTMLElement).closest<HTMLAnchorElement>(
        "a[data-practice]",
      );
      if (
        !link ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const select = form.current?.elements.namedItem(
        "practice",
      ) as HTMLSelectElement | null;
      if (
        select &&
        practiceOptions.some((option) => option.value === link.dataset.practice)
      )
        select.value = link.dataset.practice!;
    };
    document.addEventListener("click", choosePractice);
    return () => document.removeEventListener("click", choosePractice);
  }, []);

  useEffect(() => {
    if (status === "success" || status === "error")
      statusBox.current?.focus({ preventScroll: true });
  }, [status]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    const fields = new FormData(event.currentTarget);
    const data: Enquiry = {
      name: String(fields.get("name") ?? "").trim(),
      email: String(fields.get("email") ?? "").trim(),
      practice: String(fields.get("practice") ?? "general"),
      timezone: String(fields.get("timezone") ?? "").trim(),
      message: String(fields.get("message") ?? "").trim(),
    };
    setFallback(enquiryMailto(data));
    const fieldErrors = validateEnquiry(data);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length) {
      setStatus("idle");
      const first = Object.keys(fieldErrors)[0];
      (form.current?.elements.namedItem(first) as HTMLElement | null)?.focus();
      return;
    }
    const body = JSON.stringify({
      ...data,
      website: fields.get("website") ?? "",
    });
    if (attempt.current?.body !== body)
      attempt.current = { body, id: crypto.randomUUID() };
    setStatus("sending");
    try {
      const response = await fetch("/api/enquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": attempt.current!.id,
        },
        body,
        signal: AbortSignal.timeout(15000),
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true)
        throw new Error("Enquiry not accepted");
      setStatus("success");
      form.current?.reset();
      attempt.current = null;
    } catch {
      setFeedback(
        "We couldn’t confirm that your message was sent. Your words are still here. Try again, or send them using your email app.",
      );
      setStatus("error");
    }
  }

  function fieldError(name: keyof Enquiry) {
    return errors[name] ? (
      <p id={`${name}-error`} className="field-error">
        {errors[name]}
      </p>
    ) : null;
  }

  return (
    <form
      method="post"
      action="/api/enquiry"
      ref={form}
      className="enquiry-form"
      onSubmit={submit}
      noValidate
      aria-label="Enquire with Girija"
      aria-busy={status === "sending"}
    >
      <p className="form-intro">
        All fields are required unless marked optional.
      </p>
      {status === "success" && (
        <div
          className="form-status form-status--success"
          role="status"
          tabIndex={-1}
          ref={statusBox}
        >
          <p>
            <strong>Your message is on its way.</strong>Thank you for writing.
            Girija can reply to the email address you shared. Your class has not
            been booked yet.
          </p>
        </div>
      )}
      {status === "error" && (
        <div className="form-status" role="alert" tabIndex={-1} ref={statusBox}>
          <p>{feedback}</p>
          <a href={fallback}>Send this message by email</a>
        </div>
      )}
      <div className="form-grid">
        <div className="field">
          <label htmlFor="name">Your name</label>
          <input
            id="name"
            name="name"
            autoComplete="name"
            required
            maxLength={100}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          {fieldError("name")}
        </div>
        <div className="field">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {fieldError("email")}
        </div>
      </div>
      <div className="field">
        <label htmlFor="practice">What would you like to talk about?</label>
        <select
          id="practice"
          name="practice"
          defaultValue="general"
          required
          aria-invalid={!!errors.practice}
          aria-describedby={errors.practice ? "practice-error" : undefined}
        >
          {practiceOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {fieldError("practice")}
      </div>
      <div className="field">
        <label htmlFor="timezone">
          Your city or time zone <span>(optional)</span>
        </label>
        <input
          id="timezone"
          name="timezone"
          autoComplete="address-level2"
          maxLength={100}
          aria-invalid={!!errors.timezone}
          aria-describedby={errors.timezone ? "timezone-error" : undefined}
        />
        {fieldError("timezone")}
      </div>
      <div className="field">
        <label htmlFor="message">Your message</label>
        <textarea
          id="message"
          name="message"
          required
          minLength={10}
          maxLength={3000}
          rows={4}
          aria-invalid={!!errors.message}
          aria-describedby={
            errors.message ? "message-help message-error" : "message-help"
          }
        />
        <p id="message-help" className="form-help">
          Tell us what you’d like help with. Please leave out medical records or
          sensitive health details.
        </p>
        {fieldError("message")}
      </div>
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <p className="form-privacy">
        We use your details to respond to your enquiry.{" "}
        <Link href="/privacy">Read how your message is handled.</Link>
      </p>
      <button
        className="button"
        type="submit"
        disabled={!ready || status === "sending"}
      >
        {status === "sending" ? "Sending your message…" : "Send to Girija"}
        <ArrowRight size={18} aria-hidden="true" />
      </button>
      <p className="sr-only" role="status">
        {status === "sending" ? "Sending your message. Please wait." : ""}
      </p>
      <p className="form-fallback">
        Prefer email? <a href={fallback}>Write to Girija directly.</a>
      </p>
      <noscript>
        <p className="form-status">
          To send a message without JavaScript,{" "}
          <a href="mailto:vagarthayoga@gmail.com">
            email vagarthayoga@gmail.com
          </a>
          .
        </p>
      </noscript>
    </form>
  );
}

function subscribeToHydration() {
  return () => {};
}
