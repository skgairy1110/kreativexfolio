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
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-border bg-background/70 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <div className="container-px flex h-16 items-center justify-between md:h-20">
       <Link to="/" className="flex items-center">
  <img
    src="/images/logo.svg"
    alt="Shankar Gairy Logo"
    className="h-8 w-auto"
  />
</Link>
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
        <a
          href={`mailto:${profile.email}`}
          className="hidden text-xs uppercase tracking-[0.2em] text-foreground/70 transition-colors hover:text-primary md:inline-flex"
        >
          Let's Talk →
        </a>
      </div>
    </header>
  );
}
