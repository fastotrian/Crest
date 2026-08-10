import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell, CrestLogo } from "@/components/site-shell";
import { WINGS, LEADERSHIP, EVENTS, ACHIEVEMENTS } from "@/lib/crest-data";
import {
  ArrowRight,
  Cpu,
  Rocket,
  Code2,
  CircuitBoard,
  Sparkles,
  Trophy,
  Users,
  Calendar,
  Zap,
  Award,
  Crown,
  Medal,
  Flame,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CREST — Learn. Build. Compete." },
      {
        name: "description",
        content:
          "Student-driven Tier-1 technical community for Robotics, Electronics, Software & Technology at LPU.",
      },
    ],
  }),
  component: Home,
});

const STATS = [
  { label: "Events Conducted", value: "5+", icon: Calendar },
  { label: "Inter-University", value: "5", icon: Trophy },
  { label: "Workshops", value: "2+", icon: Zap },
  { label: "Active Members", value: "85+", icon: Users },
];

const REACH = [
  { label: "Total Views", value: "3.2L+" },
  { label: "Interactions", value: "10K+" },
  { label: "Followers", value: "225" },
  { label: "Window", value: "5 mo" },
];

function Home() {
  return (
    <SiteShell>
      {/* HERO */}
      <section className="relative overflow-hidden bg-aurora">
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
        <div className="absolute inset-0 bg-noise opacity-[0.15] mix-blend-overlay pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[720px] h-[720px] rounded-full bg-primary/15 blur-3xl pointer-events-none animate-glow-pulse" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent pointer-events-none" />


        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 md:py-36 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/60 backdrop-blur text-xs font-mono uppercase tracking-widest text-muted-foreground animate-fade-up">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-glow-pulse" />
            Tier 1 · Technical · LPU
          </div>

          <div className="mt-8 flex justify-center animate-fade-up" style={{ animationDelay: "80ms" }}>
            <div className="relative">
              <CrestLogo className="w-24 h-24 md:w-28 md:h-28 animate-float-slow" />
              <div className="absolute inset-0 blur-2xl bg-gradient-to-r from-brand-red/50 via-brand-yellow/40 to-brand-blue/50 -z-10 animate-glow-pulse" />
            </div>
          </div>

          <h1
            className="mt-8 text-5xl sm:text-6xl md:text-8xl font-bold tracking-tight animate-tilt-in"
            style={{ animationDelay: "160ms" }}
          >
            <span className="text-gradient-brand animate-gradient-x inline-block">CREST</span>
          </h1>

          <p
            className="mt-3 text-sm md:text-base font-mono uppercase tracking-[0.4em] text-muted-foreground animate-fade-up"
            style={{ animationDelay: "220ms" }}
          >
            Learn · Build · Compete
          </p>
          <p
            className="mt-6 max-w-2xl mx-auto text-base md:text-lg text-muted-foreground animate-fade-up"
            style={{ animationDelay: "280ms" }}
          >
            Community for <span className="text-foreground">Robotics</span>,{" "}
            <span className="text-foreground">Electronics</span>,{" "}
            <span className="text-foreground">Software</span> and{" "}
            <span className="text-foreground">Technology</span>. A student-driven organization
            fostering an "after-5" innovation culture — beyond conventional academics.
          </p>

          <div
            className="mt-10 flex flex-wrap gap-3 justify-center animate-fade-up"
            style={{ animationDelay: "340ms" }}
          >
            <Link
              to="/apply"
              className="group relative inline-flex items-center gap-2 px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:glow-primary transition-all hover:-translate-y-0.5 overflow-hidden"
            >
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              <span className="relative">Join CREST</span>
              <ArrowRight size={16} className="relative transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/wings"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md border border-border bg-card/40 backdrop-blur text-sm font-medium hover:border-primary/60 hover:-translate-y-0.5 transition-all"
            >
              Explore Wings
            </Link>
          </div>


          {/* Marquee ticker */}
          <div className="mt-16 relative overflow-hidden border-y border-border py-3 -mx-4">
            <div className="flex gap-12 whitespace-nowrap animate-ticker font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex gap-12 shrink-0">
                  <span>▲ Robotics</span>
                  <span>◆ Electronics</span>
                  <span>● Software</span>
                  <span>■ Technology</span>
                  <span>▲ Aerospace</span>
                  <span>◆ AI / ML</span>
                  <span>● Hackathons</span>
                  <span>■ Industrial R&D</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HEADLINE WINS — priority 1 */}
      <section id="wins" className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeader
            tag="01 · Headline Wins"
            title="Where CREST shows up, CREST wins."
            subtitle="Flagship victories across ISRO, IITs and international university stages."
          />

          <div className="mt-12 grid md:grid-cols-3 gap-4">
            {ACHIEVEMENTS.filter((a) => a.priority === 1).map((a, i) => {
              const accent = [
                { grad: "from-brand-red/25 via-brand-yellow/10 to-transparent", ring: "border-brand-red/40", text: "text-brand-red", icon: Crown, glow: "glow-red" },
                { grad: "from-brand-blue/25 via-brand-violet/10 to-transparent", ring: "border-brand-blue/40", text: "text-brand-blue", icon: Flame, glow: "glow-primary" },
                { grad: "from-brand-yellow/25 via-brand-green/10 to-transparent", ring: "border-brand-yellow/40", text: "text-brand-yellow", icon: Award, glow: "glow-yellow" },
              ][i % 3];
              const Icon = accent.icon;
              return (
                <div
                  key={a.event}
                  className={`relative card-tech rounded-2xl p-6 overflow-hidden border ${accent.ring} hover:-translate-y-1 transition-all duration-300 ${accent.glow} animate-fade-up`}
                  style={{ animationDelay: `${i * 90}ms` }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${accent.grad} pointer-events-none`} />
                  <div className="relative">
                    <div className="flex items-start justify-between">
                      <div className={`w-11 h-11 rounded-lg bg-background/60 border ${accent.ring} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${accent.text}`} strokeWidth={1.5} />
                      </div>
                      <span className={`font-mono text-[10px] uppercase tracking-widest ${accent.text}`}>
                        {a.level}
                      </span>
                    </div>
                    <div className={`mt-6 font-mono text-[10px] uppercase tracking-widest ${accent.text}`}>
                      {a.pos}
                    </div>
                    <div className="mt-1 text-lg font-bold leading-tight">{a.event}</div>
                    {a.wing && (
                      <div className="mt-3 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                        {WINGS.find((w) => w.key === a.wing)?.name.replace(" Wing", "").replace("CREST ", "")} wing
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Priority-2 strip */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {ACHIEVEMENTS.filter((a) => a.priority === 2).slice(0, 4).map((a, i) => (
              <div
                key={a.event}
                className="card-tech rounded-lg p-4 border-l-2 border-l-primary hover:border-l-brand-yellow transition-colors animate-fade-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="font-mono text-[9px] uppercase tracking-widest text-primary">{a.pos}</div>
                <div className="mt-1 text-sm font-semibold leading-tight">{a.event}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/achievements"
              className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground font-mono uppercase tracking-widest"
            >
              View all {ACHIEVEMENTS.length}+ wins <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="relative py-16 border-y border-border bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className="relative overflow-hidden group animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <s.icon className="w-5 h-5 text-primary mb-3" strokeWidth={1.5} />
              <div className="text-4xl md:text-5xl font-bold text-gradient-brand">{s.value}</div>
              <div className="mt-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* WINGS */}
      <section id="wings" className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeader
            tag="02 · Wings"
            title="Six specialized wings, one community"
            subtitle="CREST is organized into specialized wings — each led by student experts building in their domain."
          />

          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {WINGS.map((w, i) => (
              <div
                key={w.key}
                className="card-tech rounded-xl p-6 relative overflow-hidden group hover:-translate-y-1 hover:border-primary/60 transition-all duration-300 animate-fade-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${w.bg} pointer-events-none`} />
                <div className={`absolute -top-16 -right-16 w-40 h-40 rounded-full ${w.color} opacity-0 group-hover:opacity-10 blur-3xl transition-opacity duration-500 bg-current`} />
                <div className="relative">
                  <div className={`font-mono text-[10px] uppercase tracking-widest ${w.color}`}>
                    {w.tagline}
                  </div>
                  <h3 className="mt-2 text-xl font-bold">{w.name}</h3>
                  <p className="mt-3 text-sm text-muted-foreground">{w.description}</p>
                  <ul className="mt-4 space-y-1.5">
                    {w.focus.map((f) => (
                      <li key={f} className="text-xs font-mono text-muted-foreground flex items-center gap-2">
                        <span className={`w-1 h-1 rounded-full bg-current ${w.color}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EVENTS */}
      <section id="events" className="relative py-24 bg-background/50 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeader
            tag="03 · Events"
            title="From ideation to national stage"
            subtitle="Flagship events organized and led by CREST members."
          />

          <div className="mt-12 relative">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/40 to-transparent" />
            <div className="space-y-6">
              {EVENTS.map((e, i) => (
                <div
                  key={e.name}
                  className="relative md:grid md:grid-cols-2 md:gap-8 items-center animate-fade-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className={i % 2 === 0 ? "md:text-right md:pr-12" : "md:col-start-2 md:pl-12"}>
                    <div className="card-tech rounded-xl p-5 ml-10 md:ml-0 hover:border-primary/60 transition-colors">
                      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-primary">
                        <span>{e.tag}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground">{e.date}</span>
                      </div>
                      <h3 className="mt-2 font-bold text-lg">{e.name}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{e.detail}</p>
                    </div>
                  </div>
                  <span className="absolute left-4 md:left-1/2 top-6 -translate-x-1/2 w-3 h-3 rounded-full bg-primary glow-primary" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MORE WINS GRID */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeader
            tag="04 · Trophy Case"
            title="A season of victories"
            subtitle="Recent wins across the country."
          />

          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ACHIEVEMENTS.slice(0, 9).map((a, i) => (
              <div
                key={a.event}
                className="card-tech rounded-lg p-4 flex items-start gap-3 hover:border-primary/60 transition-colors animate-fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className={`w-9 h-9 rounded-md border flex items-center justify-center shrink-0 ${
                  a.priority === 1 ? "bg-brand-red/10 border-brand-red/40" :
                  a.priority === 2 ? "bg-brand-yellow/10 border-brand-yellow/40" :
                  "bg-brand-blue/10 border-brand-blue/40"
                }`}>
                  {a.priority === 1 ? <Crown className="w-4 h-4 text-brand-red" strokeWidth={1.5} /> :
                   a.priority === 2 ? <Trophy className="w-4 h-4 text-brand-yellow" strokeWidth={1.5} /> :
                   <Medal className="w-4 h-4 text-brand-blue" strokeWidth={1.5} />}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{a.event}</div>
                  <div className="mt-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest">
                    <span className="text-primary">{a.pos}</span>
                    <span className="text-muted-foreground">· {a.level}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT CREST */}
      <section id="about" className="relative py-24 bg-background/50 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeader tag="05 · About" title="The CREST Mandate" />

          <div className="mt-10 grid md:grid-cols-5 gap-6">
            <div className="md:col-span-3 card-tech-hi rounded-xl p-8">
              <p className="text-base md:text-lg leading-relaxed text-muted-foreground">
                <span className="text-foreground font-semibold">CREST</span> — Community for
                Robotics, Electronics, Software and Technology — is a{" "}
                <span className="text-foreground">student-driven organization</span> dedicated to
                fostering an <span className="text-brand-yellow">"after-5" innovation culture</span>{" "}
                beyond conventional academics and DL culture. Focused on hands-on project
                development, industrial collaboration, and technical excellence, CREST builds a
                strong self-driven community where students{" "}
                <span className="text-brand-green">learn</span>,{" "}
                <span className="text-brand-blue">support</span>, and{" "}
                <span className="text-brand-red">grow</span> together.
              </p>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                With the vision of expanding pan-India, CREST strives to cultivate industry-ready
                innovators and future technology leaders through collaboration, creativity, and
                practical exposure.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 font-mono text-xs">
                <Chip>Tier 1</Chip>
                <Chip>Technical</Chip>
                <Chip>Student-Driven</Chip>
                <Chip>Pan-India Vision</Chip>
              </div>
            </div>

            <div className="md:col-span-2 grid grid-cols-2 gap-3">
              {[
                { Icon: Cpu, label: "Robotics", color: "text-brand-yellow", ring: "hover:border-brand-yellow/60" },
                { Icon: CircuitBoard, label: "Electronics", color: "text-brand-green", ring: "hover:border-brand-green/60" },
                { Icon: Code2, label: "Software", color: "text-brand-blue", ring: "hover:border-brand-blue/60" },
                { Icon: Rocket, label: "Aerospace", color: "text-brand-red", ring: "hover:border-brand-red/60" },
              ].map(({ Icon, label, color, ring }, i) => (
                <div
                  key={i}
                  className={`card-tech rounded-xl p-5 flex flex-col justify-between transition-colors group ${ring}`}
                >
                  <Icon className={`w-6 h-6 ${color} transition-transform group-hover:scale-110`} strokeWidth={1.5} />
                  <div className="mt-6">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Pillar {i + 1}
                    </div>
                    <div className="font-semibold mt-1">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* LEADERSHIP */}
      <section id="leadership" className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeader tag="06 · Leadership" title="Meet the executive core" />

          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {LEADERSHIP.map((l, i) => (
              <div
                key={l.role}
                className="card-tech rounded-xl p-6 text-center group hover:border-primary/60 transition-colors animate-fade-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-brand-red via-brand-yellow to-brand-blue p-[2px] group-hover:animate-spin-slow">
                  <div className="w-full h-full rounded-full bg-card flex items-center justify-center text-2xl font-bold">
                    {l.initials}
                  </div>
                </div>
                <div className="mt-4 font-mono text-[10px] uppercase tracking-widest text-primary">
                  {l.role}
                </div>
                <div className="mt-1 font-semibold">{l.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* REACH */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeader
            tag="06 · Reach"
            title="Instagram · Jan – May"
            subtitle="CREST's digital footprint in a five-month window."
          />
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            {REACH.map((r, i) => (
              <div
                key={r.label}
                className="card-tech rounded-xl p-6 text-center relative overflow-hidden animate-fade-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="absolute inset-0 animate-shimmer pointer-events-none" />
                <div className="relative text-3xl md:text-4xl font-bold text-gradient-brand">
                  {r.value}
                </div>
                <div className="relative mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {r.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="card-tech rounded-2xl p-10 md:p-16 text-center relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-brand-red/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-brand-blue/20 blur-3xl" />
            <div className="relative">
              <Sparkles className="w-8 h-8 text-primary mx-auto" strokeWidth={1.5} />
              <h2 className="mt-4 text-3xl md:text-5xl font-bold">
                Ready to <span className="text-gradient-brand">build with us?</span>
              </h2>
              <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
                Recruitment for the next batch runs August–September. Apply now to join a wing and
                start building.
              </p>
              <Link
                to="/apply"
                className="mt-8 inline-flex items-center gap-2 px-8 py-3.5 rounded-md bg-primary text-primary-foreground font-medium hover:glow-primary transition-all"
              >
                Start your application <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function SectionHeader({
  tag,
  title,
  subtitle,
}: {
  tag: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="max-w-3xl">
      <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary">{tag}</div>
      <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight">{title}</h2>
      {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2.5 py-1 rounded-md border border-border bg-card/60 text-xs text-muted-foreground">
      {children}
    </span>
  );
}
