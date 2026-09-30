export const practiceOptions = [
  { value: "general", label: "I have a question" },
  { value: "regular", label: "Regular yoga" },
  { value: "prenatal", label: "Prenatal yoga" },
  { value: "postnatal", label: "Postnatal yoga" },
] as const;

export type Enquiry = {
  name: string;
  email: string;
  practice: string;
  timezone: string;
  message: string;
};
export type FieldErrors = Partial<Record<keyof Enquiry, string>>;

export function validateEnquiry(data: Enquiry): FieldErrors {
  const errors: FieldErrors = {};
  if (
    !data.name.trim() ||
    data.name.length > 100 ||
    /[\r\n\u0000-\u001f]/.test(data.name)
  )
    errors.name = "Enter your name, using 100 characters or fewer.";
  if (
    data.email.length > 254 ||
    !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(data.email)
  )
    errors.email = "Enter an email address we can reply to.";
  if (!practiceOptions.some((option) => option.value === data.practice))
    errors.practice = "Choose a practice or select ‘I have a question’.";
  if (data.timezone.length > 100 || /[\r\n\u0000-\u001f]/.test(data.timezone))
    errors.timezone = "Keep your time zone to 100 characters or fewer.";
  if (data.message.trim().length < 10 || data.message.length > 3000)
    errors.message = "Write a little more, between 10 and 3,000 characters.";
  return errors;
}

export function enquiryMailto(data: Partial<Enquiry> = {}) {
  const practice =
    practiceOptions.find((option) => option.value === data.practice)?.label ??
    "Yoga enquiry";
  const body = [
    "Hello Girija,",
    "",
    data.message ?? "",
    "",
    `Name: ${data.name ?? ""}`,
    `Email: ${data.email ?? ""}`,
    `Time zone: ${data.timezone ?? ""}`,
  ].join("\n");
  return `mailto:vagarthayoga@gmail.com?subject=${encodeURIComponent(practice)}&body=${encodeURIComponent(body)}`;
}
