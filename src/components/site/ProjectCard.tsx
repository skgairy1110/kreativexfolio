import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";

export type Project = {
  slug: string;
  title: string;
  client?: string;
  year: string;
  category?: string;
  cover?: string;
  image?: string;
};

export function ProjectCard({ project, size = "md" }: { project: Project; size?: "sm" | "md" | "lg" }) {
  const ratio = size === "lg" ? "aspect-[16/10]" : size === "sm" ? "aspect-[4/5]" : "aspect-[4/3]";
  const src = project.cover || project.image || "";
  return (
    <Link to="/work/$slug" params={{ slug: project.slug }} className="group block">
      <div className={`relative overflow-hidden rounded-xl border border-border bg-card ${ratio}`}>
        <motion.img
          src={src}
          alt={project.title}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover will-change-transform"
          initial={{ scale: 1.04 }}
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
        />
        {/* Base gradient for legibility */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/70 via-background/10 to-transparent" />
        {/* Dark overlay on hover */}
        <div className="pointer-events-none absolute inset-0 bg-background/55 opacity-0 transition-opacity duration-700 ease-out group-hover:opacity-100" />

        {/* Meta footer */}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 transition-all duration-500 ease-out group-hover:translate-y-[-2px]">
          <div>
            {project.category && (
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                {project.category}
              </p>
            )}
            <h3 className="font-display mt-1 text-2xl leading-tight">{project.title}</h3>
          </div>
          <span className="font-mono-ui text-xs text-muted-foreground">{project.year}</span>
        </div>

        {/* Hover CTA */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="font-mono-ui translate-y-3 rounded-full border border-primary/60 bg-background/40 px-5 py-2.5 text-[11px] uppercase tracking-[0.3em] text-primary opacity-0 backdrop-blur-sm transition-all duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100">
            View Case Study →
          </span>
        </div>
      </div>
    </Link>
  );
}
