import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import profile from "@/data/profile.json";
import projectsData from "@/data/projects.json";
import experience from "@/data/experience.json";
import skills from "@/data/skills.json";
import { MagneticButton } from "@/components/site/MagneticButton";
import { Marquee } from "@/components/site/Marquee";
import { ProjectCard, type Project } from "@/components/site/ProjectCard";
import { Reveal } from "@/components/site/Reveal";
import { PageTransition } from "@/components/site/PageTransition";

const projects = projectsData as Project[];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${profile.name} — ${profile.title}` },
      { name: "description", content: profile.tagline },
      { property: "og:title", content: `${profile.name} — ${profile.title}` },
      { property: "og:description", content: profile.tagline },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

function Index() {
  const featured = projects.slice(0, 6);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.35]);
  return (
    <PageTransition>
      {/* HERO */}
      <section ref={heroRef} className="relative">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="container-px pb-24 pt-16 md:pb-40 md:pt-32">
          <Reveal>
            <p className="font-mono-ui text-xs uppercase tracking-[0.3em] text-muted-foreground">
              <span className="mr-3 inline-block size-2 translate-y-[-1px] animate-pulse rounded-full bg-primary align-middle" />
              Available for select projects · 2026
            </p>
          </Reveal>

          <h1 className="font-display mt-10 text-balance text-[15vw] leading-[0.88] tracking-tight md:text-[10.5rem]">
            {profile.name.split(" ").map((word, wi) => (
              <span key={word + wi} className="mr-6 inline-block overflow-hidden align-bottom">
                <motion.span
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 1.15, delay: 0.15 + wi * 0.12, ease: [0.2, 0.7, 0.2, 1] }}
                  className="inline-block"
                >
                  {wi === 1 ? <em className="italic text-primary">{word}</em> : word}
                </motion.span>
              </span>
            ))}
          </h1>

          <div className="mt-14 grid gap-10 md:mt-20 md:grid-cols-12">
            <Reveal className="md:col-span-5 md:col-start-1" delay={0.3}>
              <p className="font-mono-ui text-xs uppercase tracking-[0.3em] text-muted-foreground">
                {profile.title}
              </p>
            </Reveal>
            <Reveal className="md:col-span-6 md:col-start-7" delay={0.4}>
              <p className="text-pretty text-xl text-foreground/80 md:text-2xl">
                {profile.intro}
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <MagneticButton href={profile.resumeUrl} download>
                  Download Resume
                </MagneticButton>
                <MagneticButton to="/work" variant="ghost">
                  View Portfolio →
                </MagneticButton>
              </div>
            </Reveal>
          </div>
        </motion.div>
      </section>

      <Marquee items={profile.marquee} />

      {/* FEATURED WORK */}
      <section className="container-px py-24 md:py-40">
        <div className="flex items-end justify-between gap-6">
          <Reveal>
            <p className="font-mono-ui text-xs uppercase tracking-[0.3em] text-muted-foreground">
              · 01 — Selected Work
            </p>
            <h2 className="font-display mt-4 text-5xl leading-[0.95] md:text-7xl">
              Recent projects.
            </h2>
          </Reveal>
          <Reveal>
            <Link
              to="/work"
              className="hidden text-xs uppercase tracking-[0.25em] text-foreground/70 hover:text-primary md:inline-flex"
            >
              All work →
            </Link>
          </Reveal>
        </div>

        {/* Bento-style grid */}
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-6">
          {featured.map((p, i) => {
            const span =
              i === 0 ? "md:col-span-4" :
              i === 1 ? "md:col-span-2" :
              i === 2 ? "md:col-span-2" :
              i === 3 ? "md:col-span-4" :
              "md:col-span-3";
            const size = i === 0 || i === 3 ? "lg" : "md";
            return (
              <Reveal key={p.slug} className={span} delay={i * 0.05}>
                <ProjectCard project={p} size={size as "lg" | "md"} />
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* DIVIDER */}
      <SectionDivider label="About" index="02" />

      {/* ABOUT SNAPSHOT */}
      <section className="container-px py-24 md:py-40">
        <div className="grid gap-16 md:grid-cols-12">
          <Reveal className="md:col-span-5">
            <p className="font-mono-ui text-xs uppercase tracking-[0.3em] text-muted-foreground">
              · 02 — A little about me
            </p>
            <h2 className="font-display mt-6 text-5xl leading-[0.95] md:text-7xl">
              A designer who ships <em className="text-primary">systems</em>, not screens.
            </h2>
          </Reveal>
          <div className="space-y-12 md:col-span-6 md:col-start-7">
            <Reveal>
              <p className="text-lg text-foreground/80 md:text-xl">
                Twelve years across brand, motion and product. Today I lead creative at RateGain,
                where I help shape how the world's largest travel companies see, hear and use the brand.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="hairline pt-8">
                <p className="font-mono-ui mb-4 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Disciplines
                </p>
                <ul className="flex flex-wrap gap-2">
                  {skills.disciplines.map((d) => (
                    <li key={d} className="rounded-full border border-border px-4 py-2 text-sm">
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="hairline pt-8">
                <p className="font-mono-ui mb-4 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Tools
                </p>
                <ul className="flex flex-wrap gap-x-6 gap-y-2 text-foreground/80">
                  {skills.tools.map((t) => (
                    <li key={t} className="text-sm">{t}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <SectionDivider label="Experience" index="03" />

      {/* EXPERIENCE */}
      <section className="container-px py-24 md:py-32">
        <Reveal>
          <p className="font-mono-ui text-xs uppercase tracking-[0.3em] text-muted-foreground">
            · 03 — Experience
          </p>
          <h2 className="font-display mt-6 text-5xl leading-[0.95] md:text-7xl">
            Where I've designed.
          </h2>
        </Reveal>
        <ul className="mt-16 divide-y divide-border border-y border-border">
          {experience.map((e, i) => (
            <Reveal key={e.role + e.company} delay={i * 0.05}>
              <li className="group grid grid-cols-12 items-center gap-4 py-8 transition-colors hover:bg-card/40">
                <span className="font-mono-ui col-span-12 text-xs uppercase tracking-[0.3em] text-muted-foreground md:col-span-2">
                  {e.period}
                </span>
                <div className="col-span-12 md:col-span-7">
                  <h3 className="font-display text-2xl md:text-3xl">{e.role}</h3>
                  <p className="mt-2 text-foreground/70">{e.summary}</p>
                </div>
                <span className="col-span-12 text-right text-sm uppercase tracking-[0.2em] text-foreground/80 md:col-span-3">
                  {e.company}
                </span>
              </li>
            </Reveal>
          ))}
        </ul>
        <div className="mt-12">
          <MagneticButton to="/about" variant="ghost">Full experience →</MagneticButton>
        </div>
      </section>
    </PageTransition>
  );
}

function SectionDivider({ label, index }: { label: string; index: string }) {
  return (
    <div className="container-px">
      <div className="hairline flex items-center justify-between py-6 font-mono-ui text-xs uppercase tracking-[0.3em] text-muted-foreground">
        <span>{index} / {label}</span>
        <span className="hidden md:inline">— scroll</span>
      </div>
    </div>
  );
}
