import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { EVENTS } from "@/lib/crest-data";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events · CREST" },
      { name: "description", content: "Flagship hackathons, techfests and workshops organized and led by CREST." },
    ],
  }),
  component: EventsPage,
});

const SDG = [
  { name: "Innotek", dates: "21–22 Apr 2026", sdg: "SDG 8 · 9 · 12", why: "Industrial project expo promoting innovation, industry readiness, and practical sustainable solutions." },
  { name: "Resurgence", dates: "11–12 Mar 2026", sdg: "All 17 SDGs", why: "Hackathon fully dedicated to solving challenges across every SDG goal." },
  { name: "Cognitia", dates: "10–12 Mar 2026", sdg: "SDG 4 · 9 · 17", why: "Annual techfest supporting quality education, innovation, and collaboration." },
  { name: "C Workshop", dates: "27 Oct – 14 Nov 2025", sdg: "SDG 4 · 8 · 9", why: "Strengthens foundational programming, employability, and technical competence." },
  { name: "Python Workshop", dates: "20 Aug – 17 Oct 2025", sdg: "SDG 4 · 8 · 9", why: "Builds digital literacy, coding capability, and future job readiness." },
];

function EventsPage() {
  return (
    <SiteShell>
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary">/events</div>
          <h1 className="mt-3 text-4xl md:text-6xl font-bold">
            Events <span className="text-gradient-brand">Organised</span>
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            From two-day expos to national hackathons, CREST members lead planning, promotion and execution end-to-end.
          </p>

          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {EVENTS.map((e, i) => (
              <div
                key={e.name}
                className="card-tech rounded-xl p-6 hover:border-primary/60 transition-colors animate-fade-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest">
                  <span className="text-primary">{e.tag}</span>
                  <span className="text-muted-foreground">· {e.date}</span>
                </div>
                <h3 className="mt-2 text-lg font-bold">{e.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{e.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-16">
            <h2 className="text-2xl font-bold">SDG Alignment</h2>
            <p className="mt-2 text-sm text-muted-foreground">Each initiative maps to specific United Nations Sustainable Development Goals.</p>

            <div className="mt-6 card-tech rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-card/60 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-3">Event</th>
                    <th className="text-left px-4 py-3 hidden sm:table-cell">Dates</th>
                    <th className="text-left px-4 py-3">SDGs</th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">Why it fits</th>
                  </tr>
                </thead>
                <tbody>
                  {SDG.map((s) => (
                    <tr key={s.name} className="border-t border-border hover:bg-card/40 transition-colors">
                      <td className="px-4 py-3 font-semibold">{s.name}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{s.dates}</td>
                      <td className="px-4 py-3 font-mono text-xs text-primary">{s.sdg}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{s.why}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
