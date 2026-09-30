import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { headers } from "next/headers";
import "./globals.css";

const serif = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-400-italic.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-serif",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});
const sans = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/dm-sans/files/dm-sans-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/dm-sans/files/dm-sans-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap",
});

const title = "Vagartha Yoga | Personal Online Yoga with Girija";
const description =
  "One-to-one online yoga with Girija Jayashankar. Ask about regular, prenatal or postnatal practice, session details and availability.";

export const metadata: Metadata = {
  metadataBase: new URL("https://vagarthayoga.com"),
  title: { default: title, template: "%s | Vagartha Yoga" },
  description,
  openGraph: {
    title,
    description,
    type: "website",
    locale: "en_IN",
    url: "https://vagarthayoga.com",
    siteName: "Vagartha Yoga",
    images: [
      {
        url: "/social-card.png",
        width: 1200,
        height: 630,
        alt: "Vagartha Yoga. Personal online yoga with Girija Jayashankar.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/social-card.png"],
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { themeColor: "#f6f3ea" };

const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://vagarthayoga.com/#organization",
  name: "Vagartha Yoga",
  url: "https://vagarthayoga.com",
  logo: "https://vagarthayoga.com/apple-touch-icon.png",
  email: "vagarthayoga@gmail.com",
  description,
  sameAs: ["https://www.instagram.com/yogawithgirija/"],
  areaServed: ["India", "United Arab Emirates", "Canada", "United States"],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organization).replace(/</g, "\\u003c"),
          }}
        />
        {children}
      </body>
    </html>
  );
}
