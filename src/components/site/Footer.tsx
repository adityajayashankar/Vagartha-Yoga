import Link from "next/link";
import { Brand } from "./Elements";
import { contact } from "./content";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div>
          <Brand />
          <p>Personal online yoga with Girija Jayashankar.</p>
        </div>
        <nav aria-label="Footer">
          <Link href="/#sessions">The practice</Link>
          <Link href="/#about">Meet Girija</Link>
          <Link href="/#contact">Enquire</Link>
          <Link href="/privacy">Privacy</Link>
          <a href={contact.instagram} target="_blank" rel="noreferrer">
            Instagram <span className="sr-only">(opens in a new tab)</span>↗
          </a>
        </nav>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Vagartha Yoga</span>
        <span>vagarthayoga.com</span>
      </div>
    </footer>
  );
}
