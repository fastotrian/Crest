import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { ACHIEVEMENTS } from "@/lib/crest-data";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/achievements")({
  head: () => ({
    meta: [
      { title: "Achievements · CREST" },
      { name: "description", content: "National and international wins by CREST members across hackathons, competitions and techfests." },
    ],
  }),
  component: AchievementsPage,
});

function levelColor(level: string) {
  if (level === "International") return "text-brand-red";
  if (level === "National") return "text-brand-blue";
  if (level === "Regional") return "text-brand-yellow";
  return "text-brand-green";
}

function AchievementsPage() {
  return (
    <SiteShell>
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary">/achievements</div>
          <h1 className="mt-3 text-4xl md:text-6xl font-bold">
            National & <span className="text-gradient-brand">International</span> Wins
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            A record of CREST's competitive victories — hackathons, expos, techfests and beyond.
          </p>

          <div className="mt-12 grid md:grid-cols-2 gap-3">
            {ACHIEVEMENTS.map((a, i) => (
              <div
                key={i}
                className="card-tech rounded-lg p-4 flex items-start gap-4 hover:border-primary/60 transition-colors animate-fade-up"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="w-10 h-10 rounded-md bg-brand-yellow/10 border border-brand-yellow/30 flex items-center justify-center shrink-0">
                  <Trophy className="w-5 h-5 text-brand-yellow" strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{a.event}</div>
                  <div className="mt-1 flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest">
                    <span className="text-primary">{a.pos}</span>
                    <span className={levelColor(a.level)}>{a.level}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
