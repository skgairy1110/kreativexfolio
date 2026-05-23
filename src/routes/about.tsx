import { createFileRoute } from "@tanstack/react-router";
import profile from "@/data/profile.json";
import experience from "@/data/experience.json";
import skills from "@/data/skills.json";
import { Reveal } from "@/components/site/Reveal";
import { MagneticButton } from "@/components/site/MagneticButton";
import { PageTransition } from "@/components/site/PageTransition";
import { Marquee } from "@/components/site/Marquee";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Shankar Gairy" },
      { name: "description", content: `${profile.title}. ${profile.intro}` },
      { property: "og:title", content: "About — Shankar Gairy" },
      { property: "og:description", content: profile.tagline },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <PageTransition>
      <section className="container-px pb-16 pt-16 md:pb-24 md:pt-32">
        <Reveal>
          <p className="font-mono-ui text-xs uppercase tracking-[0.3em] text-muted-foreground">
            — Index / About & Experience
          </p>
          <h1 className="font-display mt-8 text-balance text-7xl leading-[0.9] md:text-[11rem]">
            A designer's <em className="italic text-primary">decade</em>.
          </h1>
        </Reveal>

        <div className="mt-16 grid gap-12 md:grid-cols-12">
          <Reveal className="md:col-span-5">
            <p className="font-mono-ui text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Currently
            </p>
            <p className="mt-4 text-xl text-foreground/90">{profile.title}</p>
            <p className="mt-1 text-foreground/60">{profile.location}</p>
          </Reveal>
          <Reveal className="md:col-span-6 md:col-start-7" delay={0.1}>
            <p className="text-pretty text-xl text-foreground/80 md:text-2xl">
              {profile.intro}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <MagneticButton href={profile.resumeUrl} download>Download Resume</MagneticButton>
              <MagneticButton href={`mailto:${profile.email}`} variant="ghost">Get in touch →</MagneticButton>
            </div>
          </Reveal>
        </div>
      </section>

      <Marquee items={profile.marquee} reverse />

      <section className="container-px py-24 md:py-32">
        <Reveal>
          <p className="font-mono-ui text-xs uppercase tracking-[0.3em] text-muted-foreground">
            · Experience
          </p>
          <h2 className="font-display mt-6 text-5xl leading-[0.95] md:text-7xl">
            12+ years, four chapters.
          </h2>
        </Reveal>
        <ol className="mt-16 divide-y divide-border border-y border-border">
          {experience.map((e, i) => (
            <Reveal key={e.role + e.company} delay={i * 0.05}>
              <li className="grid grid-cols-12 gap-6 py-10 md:py-14">
                <div className="col-span-12 md:col-span-3">
                  <p className="font-mono-ui text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    {e.period}
                  </p>
                  <p className="mt-2 text-sm text-foreground/60">{e.location}</p>
                </div>
                <div className="col-span-12 md:col-span-9">
                  <h3 className="font-display text-3xl md:text-4xl">{e.role}</h3>
                  <p className="mt-1 text-foreground/70">{e.company}</p>
                  <p className="mt-5 max-w-3xl text-lg text-foreground/80">{e.summary}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="container-px py-24">
        <div className="grid gap-12 md:grid-cols-2">
          <Reveal>
            <p className="font-mono-ui text-xs uppercase tracking-[0.3em] text-muted-foreground">
              · Disciplines
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {skills.disciplines.map((d) => (
                <li key={d} className="rounded-full border border-border px-4 py-2 text-sm">{d}</li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="font-mono-ui text-xs uppercase tracking-[0.3em] text-muted-foreground">
              · Tools
            </p>
            <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 text-foreground/80">
              {skills.tools.map((t) => (
                <li key={t} className="border-b border-border/50 py-2 text-sm">{t}</li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>
    </PageTransition>
  );
}
