import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import projectsData from "@/data/projects.json";
import { Reveal } from "@/components/site/Reveal";
import { PageTransition } from "@/components/site/PageTransition";
import { MagneticButton } from "@/components/site/MagneticButton";
import { motion } from "framer-motion";

type Project = {
  slug: string;
  title: string;
  client?: string;
  year: string;
  role?: string;
  category?: string;
  // Support both schemas: rich (cover/overview) and simple (image/description)
  cover?: string;
  image?: string;
  overview?: string;
  description?: string;
  challenge: string;
  solution: string;
  process: string[] | string;
  outcome: string;
  tools?: string[];
  gallery?: string[];
};

const projects = projectsData as Project[];

export const Route = createFileRoute("/work/$slug")({
  loader: ({ params }) => {
    const project = projects.find((p) => p.slug === params.slug);
    if (!project) throw notFound();
    return { project };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.project;
    if (!p) return { meta: [{ title: "Case Study — Shankar Gairy" }] };
    const img = p.cover || p.image || "";
    const desc = p.overview || p.description || "";
    return {
      meta: [
        { title: `${p.title} — Case Study` },
        { name: "description", content: desc },
        { property: "og:title", content: `${p.title}${p.client ? ` — ${p.client}` : ""}` },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:image", content: img },
        { property: "og:url", content: `/work/${p.slug}` },
        { name: "twitter:image", content: img },
      ],
      links: [{ rel: "canonical", href: `/work/${p.slug}` }],
    };
  },
  notFoundComponent: () => (
    <div className="container-px py-40 text-center">
      <h1 className="font-display text-5xl">Project not found</h1>
      <Link to="/work" className="mt-8 inline-block text-primary underline-grow">Back to work</Link>
    </div>
  ),
  component: CaseStudy,
});

function CaseStudy() {
  const { project } = Route.useLoaderData() as { project: Project };
  const idx = projects.findIndex((p) => p.slug === project.slug);
  const next = projects[(idx + 1) % projects.length];
  const image = project.cover || project.image || "";
  const description = project.overview || project.description || "";
  const processSteps: string[] = Array.isArray(project.process)
    ? project.process
    : project.process
      ? project.process.split(/\n+/).map((s) => s.trim()).filter(Boolean)
      : [];

  return (
    <PageTransition>
      {/* HERO */}
      <section className="container-px pt-12 md:pt-20">
        <Reveal>
          <Link to="/work" className="font-mono-ui text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-primary">
            ← Back to work
          </Link>
        </Reveal>
        <Reveal delay={0.05}>
          <h1 className="font-display mt-10 text-balance text-6xl leading-[0.92] md:text-[8rem]">
            {project.title}
          </h1>
        </Reveal>
        <div className="mt-10 grid gap-6 border-y border-border py-8 text-sm md:grid-cols-4">
          {project.client && <Meta label="Client" value={project.client} />}
          <Meta label="Year" value={project.year} />
          {project.role && <Meta label="Role" value={project.role} />}
          {project.category && <Meta label="Category" value={project.category} />}
        </div>
      </section>

      {/* COVER */}
      <section className="container-px mt-12">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.1, ease: [0.2, 0.7, 0.2, 1] }}
          className="relative overflow-hidden rounded-2xl border border-border"
        >
          <img src={image} alt={project.title} className="aspect-[16/9] w-full object-cover" />
        </motion.div>
      </section>

      {/* OVERVIEW */}
      <section className="container-px py-24 md:py-32">
        <div className="grid gap-12 md:grid-cols-12">
          <Reveal className="md:col-span-3">
            <p className="font-mono-ui text-xs uppercase tracking-[0.3em] text-muted-foreground">Overview</p>
          </Reveal>
          <Reveal className="md:col-span-8 md:col-start-5" delay={0.1}>
            <p className="text-balance text-2xl leading-relaxed text-foreground/90 md:text-3xl">
              {description}
            </p>
          </Reveal>
        </div>
      </section>

      <Block label="Challenge" body={project.challenge} />
      <Block label="Solution" body={project.solution} />

      {/* PROCESS */}
      <section className="container-px py-20 md:py-28">
        <div className="grid gap-12 md:grid-cols-12">
          <Reveal className="md:col-span-3">
            <p className="font-mono-ui text-xs uppercase tracking-[0.3em] text-muted-foreground">Design process</p>
          </Reveal>
          <ol className="md:col-span-8 md:col-start-5">
            {processSteps.map((step, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <li className="hairline flex gap-6 py-6">
                  <span className="font-mono-ui w-10 text-xs text-muted-foreground">0{i + 1}</span>
                  <span className="text-lg text-foreground/90 md:text-xl">{step}</span>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* GALLERY (optional) */}
      {project.gallery && project.gallery.length > 0 && (
        <section className="container-px grid gap-6 py-16 md:grid-cols-2">
          {project.gallery.map((src, i) => (
            <Reveal key={src} delay={i * 0.05}>
              <div className="overflow-hidden rounded-xl border border-border">
                <img src={src} alt="" className="aspect-[4/3] w-full object-cover" />
              </div>
            </Reveal>
          ))}
        </section>
      )}

      <Block label="Outcome" body={project.outcome} />

      {/* TOOLS */}
      {project.tools && project.tools.length > 0 && (
      <section className="container-px py-20">
        <div className="grid gap-12 md:grid-cols-12">
          <Reveal className="md:col-span-3">
            <p className="font-mono-ui text-xs uppercase tracking-[0.3em] text-muted-foreground">Tools used</p>
          </Reveal>
          <ul className="flex flex-wrap gap-2 md:col-span-8 md:col-start-5">
            {project.tools.map((t) => (
              <li key={t} className="rounded-full border border-border px-4 py-2 text-sm">{t}</li>
            ))}
          </ul>
        </div>
      </section>
      )}

      {/* NEXT */}
      <section className="container-px py-24 md:py-32">
        <Reveal>
          <p className="font-mono-ui text-xs uppercase tracking-[0.3em] text-muted-foreground">Next project</p>
          <Link to="/work/$slug" params={{ slug: next.slug }} className="group mt-6 block">
            <h2 className="font-display text-balance text-6xl leading-[0.92] transition-colors group-hover:text-primary md:text-[7rem]">
              {next.title} →
            </h2>
          </Link>
        </Reveal>
        <div className="mt-12">
          <MagneticButton to="/work" variant="ghost">All projects →</MagneticButton>
        </div>
      </section>
    </PageTransition>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono-ui text-xs uppercase tracking-[0.3em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-foreground/90">{value}</p>
    </div>
  );
}

function Block({ label, body }: { label: string; body: string }) {
  return (
    <section className="container-px py-20 md:py-28">
      <div className="grid gap-12 md:grid-cols-12">
        <Reveal className="md:col-span-3">
          <p className="font-mono-ui text-xs uppercase tracking-[0.3em] text-muted-foreground">{label}</p>
        </Reveal>
        <Reveal className="md:col-span-8 md:col-start-5" delay={0.1}>
          <p className="text-pretty text-xl leading-relaxed text-foreground/80 md:text-2xl">{body}</p>
        </Reveal>
      </div>
    </section>
  );
}