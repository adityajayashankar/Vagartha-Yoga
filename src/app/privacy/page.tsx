import Link from "next/link";
import type { Metadata } from "next";
import { Brand } from "@/components/site/Elements";
import Footer from "@/components/site/Footer";

export const metadata: Metadata = {
  title: "Your enquiry and privacy",
  description:
    "How Vagartha Yoga handles the contact details and message you share when enquiring about online yoga.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Your enquiry and privacy | Vagartha Yoga",
    description: "How your enquiry is handled by Vagartha Yoga.",
    url: "https://vagarthayoga.com/privacy",
  },
  twitter: {
    card: "summary_large_image",
    title: "Your enquiry and privacy | Vagartha Yoga",
    description: "How your enquiry is handled by Vagartha Yoga.",
  },
};
export default function Privacy() {
  return (
    <>
      <main className="simple-page container">
        <Brand />
        <h1>
          Your enquiry
          <br />
          <em>and privacy.</em>
        </h1>
        <p>
          The enquiry form asks for your name, email address and message. You
          can also include your city or time zone. Vagartha Yoga uses these
          details to respond to you and discuss a class.
        </p>
        <h2>Where your message goes</h2>
        <p>
          Your message is sent through Resend to Girija’s Gmail inbox at
          vagarthayoga@gmail.com. It is held in the email systems used to
          deliver and receive it. The website does not keep a separate database
          of enquiries.
        </p>
        <p>
          If you use the email link, your own email app handles sending the
          message. Your email provider’s terms also apply.
        </p>
        <h2>Share only what is needed</h2>
        <p>
          Please do not send medical records or sensitive health details through
          this form. A brief question about the practice is enough to start a
          conversation.
        </p>
        <h2>Website data</h2>
        <p>
          This website does not add advertising or analytics cookies. The
          hosting and email providers may keep technical logs to operate their
          services and prevent abuse.
        </p>
        <h2>Questions about your information</h2>
        <p>
          To ask about a message you have sent, or request its deletion, email{" "}
          <a href="mailto:vagarthayoga@gmail.com">vagarthayoga@gmail.com</a>.
        </p>
        <Link className="text-link" href="/#contact">
          Return to the enquiry form
        </Link>
      </main>
      <Footer />
    </>
  );
}
