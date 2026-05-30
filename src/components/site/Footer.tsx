import profile from "@/data/profile.json";
import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="relative mt-32 border-t border-border">
      <div className="container-px py-20">
        <div className="grid gap-16 md:grid-cols-12">
          <div className="md:col-span-7">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Have a project in mind?
            </p>
            <h2 className="font-display mt-6 text-balance text-5xl leading-[0.95] md:text-7xl">
              Let's build something <em className="text-primary">unforgettable</em>.
            </h2>
            <a
              href={`mailto:${profile.email}`}
              className="mt-8 inline-flex items-center gap-3 text-lg text-foreground/80 transition-colors hover:text-primary"
            >
              <span className="underline-grow">Connect Now</span>
              <span aria-hidden>→</span>
            </a>
          </div>
          <div className="md:col-span-5">
            <div className="grid grid-cols-2 gap-10">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Sitemap</p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li><Link to="/" className="hover:text-primary">Home</Link></li>
                  <li><Link to="/work" className="hover:text-primary">Work</Link></li>
                  <li><Link to="/about" className="hover:text-primary">About</Link></li>
                </ul>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Elsewhere</p>
                <ul className="mt-4 space-y-2 text-sm">
                  {profile.socials.map((s) => (
                    <li key={s.label}>
                      <a href={s.url} target="_blank" rel="noreferrer" className="hover:text-primary">
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-20 flex flex-col items-start justify-between gap-4 border-t border-border pt-8 text-xs uppercase tracking-[0.25em] text-muted-foreground md:flex-row md:items-center">
          <span>© {new Date().getFullYear()} {profile.name}. All rights reserved.</span>
          <span>Designed & built with care.</span>
        </div>
      </div>
    </footer>
  );
}
