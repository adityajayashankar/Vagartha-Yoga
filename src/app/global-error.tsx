"use client";
import Link from "next/link";
export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <head>
        <title>Unable to load | Vagartha Yoga</title>
        <meta name="robots" content="noindex" />
      </head>
      <body>
        <main>
          <h1>We couldn’t load Vagartha Yoga.</h1>
          <p>Please try again, or email Girija about your class.</p>
          <button onClick={retry}>Try again</button>
          <p>
            <a href="mailto:vagarthayoga@gmail.com">vagarthayoga@gmail.com</a>
          </p>
          <Link href="/">Return to the home page</Link>
        </main>
      </body>
    </html>
  );
}
