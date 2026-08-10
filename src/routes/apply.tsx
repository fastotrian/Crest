import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { WINGS, saveApplication } from "@/lib/crest-data";
import { useEffect, useState } from "react";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";

export const Route = createFileRoute("/apply")({
  head: () => ({
    meta: [
      { title: "Apply · CREST Recruitment" },
      { name: "description", content: "Apply to join CREST — pick a wing, tell us about yourself, start building." },
    ],
  }),
  component: ApplyPage,
});



function ApplyPage() {
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    regNo: "",
    branch: "",
    year: "1",
    wing: WINGS[0].key,
    skills: "",
    why: "",
    portfolio: "",
  });

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("https://crest-jvfj.onrender.com/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      // ===================================================
      // BACKEND RETURNED AN ERROR STATUS
      // ===================================================

      if (!response.ok) {
        const errorText = await response.text();

        console.error("Application submission failed:", errorText);

        setMessage(
          "Something went wrong submitting your application. Please try again."
        );

        return;
      }

      const data = await response.json();

      console.log("Application response:", data);

      // Local backup / cache of the submission
      saveApplication(form);

      setSubmitted(true);

    } catch (error) {
      // =====================================================
      // NETWORK / SERVER UNREACHABLE
      // =====================================================

      console.error("Application submission error:", error);

      setMessage(
        "Unable to reach the server. Check your connection and try again."
      );

    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <SiteShell>
        <section className="py-32">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-brand-green/10 border border-brand-green/40 mx-auto flex items-center justify-center animate-fade-up">
              <CheckCircle2 className="w-8 h-8 text-brand-green" strokeWidth={1.5} />
            </div>
            <h1 className="mt-6 text-3xl md:text-4xl font-bold animate-fade-up" style={{ animationDelay: "80ms" }}>
              Application received.
            </h1>
            <p className="mt-3 text-muted-foreground animate-fade-up" style={{ animationDelay: "140ms" }}>
              Thanks {form.name.split(" ")[0]} — your CREST recruitment application is in. The wing lead will reach out at{" "}
              <span className="text-foreground font-mono">{form.email}</span>.
            </p>
            <div className="mt-8 font-mono text-xs text-muted-foreground animate-fade-up" style={{ animationDelay: "200ms" }}>
              REF · {new Date().toISOString().slice(0, 10).replace(/-/g, "")} · {form.wing.toUpperCase()}
            </div>
          </div>
        </section>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <section className="py-20 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-primary/15 blur-3xl pointer-events-none" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 backdrop-blur text-[10px] font-mono uppercase tracking-widest text-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-glow-pulse" />
            Recruitment · Live Window
          </div>
          <h1 className="mt-4 text-4xl md:text-6xl font-bold">
            Join <span className="text-gradient-brand">CREST</span>
          </h1>
          <p className="mt-4 text-muted-foreground">
            Recruitment window: August–September. Fill in your details, choose a wing, and start building.
          </p>


          <form onSubmit={submit} className="mt-10 card-tech rounded-2xl p-6 md:p-8 space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Full name" required>
                <input
                  required value={form.name} onChange={(e) => set("name", e.target.value)}
                  className="input-tech" placeholder="Your name"
                />
              </Field>
              <Field label="Email" required>
                <input
                  required type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                  className="input-tech" placeholder="you@lpu.in"
                />
              </Field>
              <Field label="Phone" required>
                <input
                  required value={form.phone} onChange={(e) => set("phone", e.target.value)}
                  className="input-tech" placeholder="+91 …"
                />
              </Field>
              <Field label="Registration No." required>
                <input
                  required value={form.regNo} onChange={(e) => set("regNo", e.target.value)}
                  className="input-tech" placeholder="120xxxxxx"
                />
              </Field>
              <Field label="Branch" required>
                <input
                  required value={form.branch} onChange={(e) => set("branch", e.target.value)}
                  className="input-tech" placeholder="CSE / ECE / Mech …"
                />
              </Field>
              <Field label="Year" required>
                <select value={form.year} onChange={(e) => set("year", e.target.value)} className="input-tech">
                  {["1", "2", "3", "4"].map((y) => (
                    <option key={y} value={y}>Year {y}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Preferred wing" required>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {WINGS.map((w) => {
                  const active = form.wing === w.key;
                  return (
                    <label
                      key={w.key}
                      className={`relative cursor-pointer px-3 py-4 rounded-lg border text-xs font-mono uppercase tracking-widest transition-all overflow-hidden ${
                        active
                          ? "border-primary bg-primary/10 text-foreground glow-primary"
                          : "border-border text-muted-foreground hover:border-primary/50 hover:-translate-y-0.5"
                      }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${w.bg} ${active ? "opacity-100" : "opacity-40"} pointer-events-none`} />
                      <input type="radio" name="wing" value={w.key} checked={active} onChange={() => set("wing", w.key)} className="sr-only" />
                      <div className="relative">
                        <span className={`block ${w.color}`}>{w.name.replace(" Wing", "").replace("CREST ", "")}</span>
                        <span className="block mt-1 text-[9px] normal-case tracking-normal text-muted-foreground">{w.tagline}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </Field>


            <Field label="Skills / tech stack" required>
              <input
                required value={form.skills} onChange={(e) => set("skills", e.target.value)}
                className="input-tech" placeholder="Python, React, Arduino, Fusion 360…"
              />
            </Field>

            <Field label="Why CREST?" required>
              <textarea
                required rows={4} value={form.why} onChange={(e) => set("why", e.target.value)}
                className="input-tech resize-none" placeholder="Tell us what you want to build with CREST."
              />
            </Field>

            <Field label="Portfolio / GitHub (optional)">
              <input
                value={form.portfolio} onChange={(e) => set("portfolio", e.target.value)}
                className="input-tech" placeholder="https://…"
              />
            </Field>

            {message && (
              <div className="text-sm text-center rounded-lg px-3 py-2 border text-brand-red bg-brand-red/10 border-brand-red/20">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-md bg-primary text-primary-foreground font-medium hover:glow-primary transition-all disabled:opacity-60"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Submitting…</>
              ) : (
                <>Submit application <ArrowRight size={16} /></>
              )}
            </button>
            <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground text-center">
              Data stays local to this device until reviewed by CREST admin.
            </p>
          </form>
        </div>
      </section>

      <style>{`
        .input-tech {
          width: 100%;
          background: oklch(0.15 0.02 260 / 0.6);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 14px;
          color: var(--foreground);
          transition: all 0.2s;
          font-family: inherit;
        }
        .input-tech:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px oklch(0.7 0.19 250 / 0.15);
        }
        .input-tech::placeholder { color: var(--muted-foreground); }
      `}</style>
    </SiteShell>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
        {label} {required && <span className="text-brand-red">*</span>}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
