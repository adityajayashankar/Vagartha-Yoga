import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Lotus() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <g
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M24 34C12 28 17 15 24 7c7 8 12 21 0 27Z" />
        <path d="M24 34C12 35 5 25 6 18c10 0 17 7 18 16Zm0 0c12 1 19-9 18-16-10 0-17 7-18 16Z" />
        <path d="M12 39h24" />
      </g>
    </svg>
  );
}

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="Vagartha Yoga home">
      <Lotus />
      <span>
        Vagartha <small>YOGA</small>
      </span>
    </Link>
  );
}

export function BookLink({
  children = "Enquire about a class",
  practice = "general",
  className = "",
}: {
  children?: React.ReactNode;
  practice?: string;
  className?: string;
}) {
  return (
    <a
      className={`button ${className}`}
      href="#contact"
      data-practice={practice}
    >
      {children}
      <ArrowRight size={18} aria-hidden="true" />
    </a>
  );
}

export function TextLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a className="text-link" href={href}>
      {children}
      <ArrowRight size={17} aria-hidden="true" />
    </a>
  );
}
