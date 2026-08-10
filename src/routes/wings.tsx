import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { WINGS } from "@/lib/crest-data";

export const Route = createFileRoute("/wings")({
  head: () => ({
    meta: [
      { title: "Wings · CREST" },
      { name: "description", content: "The specialized wings that make CREST run: CSE, Electronics, Aerospace, Robotics, Creatives and Management." },
    ],
  }),
  component: WingsPage,
});

function WingsPage() {
  return (
    <SiteShell>
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary">
            /wings
          </div>
          <h1 className="mt-3 text-4xl md:text-6xl font-bold">
            The <span className="text-gradient-brand">Wings</span> of CREST
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            CREST is structured into six specialized wings. Each wing owns its domain —
            recruiting, workshops, projects, and competitions — while collaborating on
            organization-wide missions.
          </p>

          <div className="mt-14 grid md:grid-cols-2 gap-5">
            {WINGS.map((w, i) => (
              <div
                key={w.key}
                className="card-tech rounded-2xl p-8 relative overflow-hidden group hover:-translate-y-1 hover:border-primary/60 transition-all duration-300 animate-fade-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${w.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
                />
                <div className="relative">
                  <div className={`font-mono text-[10px] uppercase tracking-widest ${w.color}`}>
                    {w.tagline}
                  </div>
                  <h2 className="mt-2 text-2xl font-bold">{w.name}</h2>
                  <p className="mt-3 text-muted-foreground">{w.description}</p>
                  <div className="mt-6 grid grid-cols-2 gap-2">
                    {w.focus.map((f) => (
                      <div
                        key={f}
                        className="text-xs font-mono px-3 py-2 rounded-md border border-border bg-card/40 text-muted-foreground"
                      >
                        {f}
                      </div>
                    ))}
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
