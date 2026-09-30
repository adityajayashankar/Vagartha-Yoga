"use client";
export default function ErrorPage({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main className="simple-page container">
      <p className="eyebrow">Vagartha Yoga</p>
      <h1>
        We couldn’t
        <br />
        <em>load this page.</em>
      </h1>
      <p>
        Please try once more. If you were making an enquiry, you can email
        Girija directly.
      </p>
      <div className="error-actions">
        <button className="button" onClick={retry}>
          Try again
        </button>
        <a href="mailto:vagarthayoga@gmail.com">Email Girija</a>
      </div>
    </main>
  );
}
