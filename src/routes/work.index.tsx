import { createFileRoute } from "@tanstack/react-router";
import projectsData from "@/data/projects.json";
import { ProjectCard, type Project } from "@/components/site/ProjectCard";
import { Reveal } from "@/components/site/Reveal";
import { PageTransition } from "@/components/site/PageTransition";

const projects = projectsData as Project[];

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
  return (
    <PageTransition>
      <section className="container-px pb-16 pt-16 md:pb-24 md:pt-32">
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

      <section className="container-px pb-24">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-6">
          {projects.map((p, i) => {
            const pattern = [
              "md:col-span-4", "md:col-span-2",
              "md:col-span-2", "md:col-span-4",
              "md:col-span-3", "md:col-span-3",
              "md:col-span-4", "md:col-span-2",
              "md:col-span-6",
            ];
            const sizes: ("lg" | "md" | "sm")[] = ["lg","md","md","lg","md","md","lg","sm","lg"];
            return (
              <Reveal key={p.slug} className={pattern[i % pattern.length]} delay={(i % 4) * 0.05}>
                <ProjectCard project={p} size={sizes[i % sizes.length]} />
              </Reveal>
            );
          })}
        </div>
      </section>
    </PageTransition>
  );
}
