import Link from "next/link";
import type { Metadata } from "next";
import { Brand } from "@/components/site/Elements";
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};
export default function NotFound() {
  return (
    <main className="simple-page container">
      <Brand />
      <p className="eyebrow">404 / Page not found</p>
      <h1>
        This page
        <br />
        <em>isn’t here.</em>
      </h1>
      <p>
        The link may have changed. You can return to the practice page or write
        to Girija.
      </p>
      <div className="error-actions">
        <Link className="button" href="/">
          Back to Vagartha Yoga
        </Link>
        <a href="mailto:vagarthayoga@gmail.com">Email Girija</a>
      </div>
    </main>
  );
}
