import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import projectsData from "@/data/projects.json";
import { ProjectCard, type Project } from "@/components/site/ProjectCard";
import { Reveal } from "@/components/site/Reveal";
import { PageTransition } from "@/components/site/PageTransition";

const projects = projectsData as Project[];

// Maps each project's raw `category` string to a broader filter group.
const CATEGORY_GROUPS: Record<string, string> = {
  "Brand Identity": "Branding",
  "Branding": "Branding",
  "Branding · SaaS": "Branding",
  "UI / UX Design": "UI / UX",
  "SaaS Product Design": "UI / UX",
  "Travel Insights Platform": "UI / UX",
  "SaaS · UI": "UI / UX",
  "Print Media": "Print & Editorial",
  "Print / Editorial Design": "Print & Editorial",
  "Report Design": "Print & Editorial",
  "Whitepaper Design": "Print & Editorial",
  "Newsletter Design": "Print & Editorial",
  "Creative Ads": "Campaigns",
  "Campaign": "Campaigns",
  "Email Campaign": "Campaigns",
  "Event Branding": "Events",
};

const FILTERS = [
  "All",
  "Branding",
  "UI / UX",
  "Print & Editorial",
  "Campaigns",
  "Events",
] as const;

type Filter = (typeof FILTERS)[number];

function groupOf(category?: string): string {
  if (!category) return "Branding";
  return CATEGORY_GROUPS[category] ?? "Branding";
}

const CARD_PATTERN = [
  "md:col-span-4", "md:col-span-2",
  "md:col-span-2", "md:col-span-4",
  "md:col-span-3", "md:col-span-3",
  "md:col-span-4", "md:col-span-2",
  "md:col-span-6",
];
const CARD_SIZES: ("lg" | "md" | "sm")[] = [
  "lg", "md", "md", "lg", "md", "md", "lg", "sm", "lg",
];

export const Route = createFileRoute("/work/")({
  head: () => ({
    meta: [
      { title: "Work — Shankar Gairy" },
      { name: "description", content: "Selected creative direction, branding, motion and product design across SaaS, travel-tech and event work." },
      { property: "og:title", content: "Work — Shankar Gairy" },
      { property: "og:description", content: "Selected creative direction, branding, motion and product design." },
      { property: "og:url", content: "/work" },
    ],
    links: [{ rel: "canonical", href: "/work" }],
  }),
  component: WorkPage,
});

function WorkPage() {
  const [active, setActive] = useState<Filter>("All");

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: projects.length };
    for (const f of FILTERS) if (f !== "All") c[f] = 0;
    projects.forEach((p) => {
      const g = groupOf(p.category);
      c[g] = (c[g] ?? 0) + 1;
    });
    return c;
  }, []);

  const filtered = useMemo(
    () =>
      active === "All"
        ? projects
        : projects.filter((p) => groupOf(p.category) === active),
    [active],
  );

  return (
    <PageTransition>
      <section className="container-px pb-10 pt-16 md:pb-12 md:pt-32">
        <Reveal>
          <p className="font-mono-ui text-xs uppercase tracking-[0.3em] text-muted-foreground">
            — Index / Work
          </p>
          <h1 className="font-display mt-8 text-balance text-7xl leading-[0.9] md:text-9xl">
            Selected <em className="italic text-primary">work</em>.
          </h1>
          <p className="mt-8 max-w-2xl text-lg text-foreground/70 md:text-xl">
            A curated archive of brand systems, product launches, motion films and event design — built with global SaaS and travel-tech teams.
          </p>
        </Reveal>
      </section>

      {/* FILTER TABS */}
      <section className="container-px pb-10 md:pb-14">
        <Reveal delay={0.1}>
          <div className="hairline flex flex-wrap items-center gap-2 pt-8 md:gap-3">
            {FILTERS.map((f) => {
              const isActive = active === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setActive(f)}
                  aria-pressed={isActive}
                  className={`relative rounded-full px-5 py-2.5 font-mono-ui text-xs uppercase tracking-[0.2em] transition-colors duration-300 ${
                    isActive
                      ? "text-primary-foreground"
                      : "text-foreground/60 hover:text-foreground"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="work-filter-pill"
                      className="absolute inset-0 rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {f}
                    <span
                      className={`text-[10px] ${
                        isActive
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {counts[f] ?? 0}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </Reveal>
      </section>

      <section className="container-px pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
            className="grid grid-cols-1 gap-6 md:grid-cols-6"
          >
            {filtered.length === 0 ? (
              <p className="col-span-full py-16 text-center text-foreground/50">
                No projects in this category yet.
              </p>
            ) : (
              filtered.map((p, i) => (
                <Reveal
                  key={p.slug}
                  className={CARD_PATTERN[i % CARD_PATTERN.length]}
                  delay={(i % 4) * 0.05}
                >
                  <ProjectCard project={p} size={CARD_SIZES[i % CARD_SIZES.length]} />
                </Reveal>
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </section>
    </PageTransition>
  );
}
