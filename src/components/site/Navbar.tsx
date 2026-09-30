"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Brand } from "./Elements";
import { navigation } from "./content";
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const header = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    let frame = 0;
    const sections = navigation.map(({ href }) => ({
      href,
      element: document.querySelector(href),
    }));
    const update = () => {
      frame = 0;
      header.current?.classList.toggle("is-scrolled", window.scrollY > 50);
      const current = sections
        .map(({ href, element }) => ({
          href,
          top: element?.getBoundingClientRect().top ?? Infinity,
        }))
        .filter(({ top }) => top <= window.innerHeight * 0.4)
        .sort((a, b) => b.top - a.top)[0];
      setActive(current?.href ?? "");
    };
    const scroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", scroll);
    update();
    return () => {
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", scroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    const outside = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", dismiss);
    window.addEventListener("pointerdown", outside);
    return () => {
      window.removeEventListener("keydown", dismiss);
      window.removeEventListener("pointerdown", outside);
    };
  }, [open]);
  return (
    <header className="site-header" ref={header}>
      <Brand />
      <nav className="desktop-nav" aria-label="Main navigation">
        {navigation.map((link) => (
          <a
            key={link.href}
            href={link.href}
            aria-current={active === link.href ? "location" : undefined}
          >
            {link.label}
          </a>
        ))}
      </nav>
      <div className="nav-actions">
        <a className="nav-book" href="#contact">
          Enquire <ArrowUpRight size={15} aria-hidden="true" />
        </a>
        <button
          ref={toggle}
          type="button"
          className="menu-toggle"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={23} /> : <Menu size={23} />}
        </button>
      </div>
      {open && (
        <nav
          className="mobile-nav"
          id="mobile-navigation"
          aria-label="Mobile navigation"
        >
          {navigation.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
              <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          ))}
          <a href="#contact" onClick={() => setOpen(false)}>
            Enquire about a class
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </nav>
      )}
    </header>
  );
}
