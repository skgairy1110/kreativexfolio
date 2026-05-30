import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import profile from "@/data/profile.json";

const links = [
  { to: "/", label: "Home" },
  { to: "/work", label: "Work" },
  { to: "/about", label: "About" },
] as const;

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled || menuOpen
          ? "border-b border-border bg-background/70 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <div className="container-px flex h-16 items-center justify-between md:h-20">
        {/* Logo */}
        <Link to="/" className="flex items-center" onClick={() => setMenuOpen(false)}>
          <img
            src="/images/logo.svg"
            alt="Shankar Gairy Logo"
            className="h-8 w-auto"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-10 text-xs uppercase tracking-[0.2em] md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              className="underline-grow text-foreground/70 transition-colors hover:text-foreground"
              activeProps={{ className: "text-primary" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <a
          href={`mailto:${profile.email}`}
          className="hidden text-xs uppercase tracking-[0.2em] text-foreground/70 transition-colors hover:text-primary md:inline-flex"
        >
          Let's Talk →
        </a>

        {/* Mobile hamburger */}
        <button
          className="flex flex-col items-end justify-center gap-[5px] md:hidden"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          <span
            className={`block h-px bg-foreground transition-all duration-300 ${
              menuOpen ? "w-6 translate-y-[6px] rotate-45" : "w-6"
            }`}
          />
          <span
            className={`block h-px bg-foreground transition-all duration-300 ${
              menuOpen ? "w-0 opacity-0" : "w-4"
            }`}
          />
          <span
            className={`block h-px bg-foreground transition-all duration-300 ${
              menuOpen ? "w-6 -translate-y-[6px] -rotate-45" : "w-6"
            }`}
          />
        </button>
      </div>

      {/* Mobile menu overlay */}
      <div
        className={`flex flex-col bg-background/95 backdrop-blur-xl transition-all duration-500 ease-in-out md:hidden ${
          menuOpen ? "max-h-screen opacity-100" : "max-h-0 overflow-hidden opacity-0"
        }`}
      >
        <nav className="container-px flex flex-col border-t border-border py-8">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              className="font-display py-4 text-4xl text-foreground/60 transition-colors hover:text-foreground"
              activeProps={{ className: "text-primary" }}
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <a
            href={`mailto:${profile.email}`}
            className="mt-6 text-xs uppercase tracking-[0.2em] text-foreground/50 transition-colors hover:text-primary"
            onClick={() => setMenuOpen(false)}
          >
            Let's Talk →
          </a>
        </nav>
      </div>
    </header>
  );
}
