import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { DashboardNav } from "@/components/navbar";
import { useEffect, useState, type FormEvent } from "react";
import {
  Send,
  Wrench,
  Briefcase,
  ArrowRightLeft,
  UserCheck,
} from "lucide-react";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [{ title: "Community · CREST" }],
  }),
  component: CommunityPage,
});

// =========================================================
// AUTH HELPERS
// =========================================================

const API_URL = "https://crest-ygqu.onrender.com";

// =========================================================
// AUTH VERIFICATION CACHE (avoids re-checking on every nav)
// =========================================================

const AUTH_CACHE_KEY = "crest_auth_verified";
const AUTH_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function readAuthCache(): boolean {
  try {
    const raw = localStorage.getItem(AUTH_CACHE_KEY);
    if (!raw) return false;

    const parsed = JSON.parse(raw);
    if (!parsed?.verifiedAt) return false;

    return Date.now() - parsed.verifiedAt < AUTH_CACHE_TTL_MS;
  } catch {
    return false;
  }
}

function writeAuthCache() {
  try {
    localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify({ verifiedAt: Date.now() }));
  } catch {
    // ignore quota / private-mode errors
  }
}

function clearAuthCache() {
  localStorage.removeItem(AUTH_CACHE_KEY);
}


function getStoredToken(): string | null {
  const token = localStorage.getItem("accessToken");
  if (!token || token === "null" || token === "undefined") {
    return null;
  }
  return token;
}

// =========================================================
// MOCK DATA
// =========================================================

const MENTORS = [
  { id: 1, name: "Dr. Anil Verma", tags: ["AI/ML", "Research"] },
  { id: 2, name: "Priya Menon (Alum)", tags: ["Embedded Systems", "IoT"] },
];

const EQUIPMENT = [
  { id: 1, name: "3D Printer — Ender 3", status: "Available" },
  { id: 2, name: "Arduino Starter Kit (x4)", status: "Booked till Fri" },
  { id: 3, name: "Oscilloscope", status: "Available" },
];

const JOBS = [
  { id: 1, title: "ML Research Intern", org: "Local AI Startup", tags: ["Remote", "Stipend"] },
  { id: 2, title: "Embedded Firmware Intern", org: "Robotics Lab", tags: ["On-site", "6 months"] },
];

// =========================================================
// HELPERS
// =========================================================

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.02] p-6 ${className}`}>
      {children}
    </div>
  );
}

function Pill({
  children,
  tone = "white",
}: {
  children: React.ReactNode;
  tone?: "sky" | "green" | "yellow" | "white";
}) {
  const map: Record<string, string> = {
    sky: "text-sky-400 border-sky-400/20 bg-sky-400/10",
    green: "text-green-400 border-green-400/20 bg-green-400/10",
    yellow: "text-yellow-400 border-yellow-400/20 bg-yellow-400/10",
    white: "text-white/50 border-white/15 bg-white/5",
  };
  return (
    <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full border ${map[tone]}`}>
      {children}
    </span>
  );
}

// =========================================================
// TAB: PITCH
// =========================================================

function PitchTab() {
  const [title, setTitle] = useState("");
  const [pitch, setPitch] = useState("");
  const [audience, setAudience] = useState("Founders");
  const [sent, setSent] = useState(false);

  function submitPitch(e: FormEvent) {
    e.preventDefault();
    // TODO: POST to your backend, e.g. /pitch
    setSent(true);
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
          <Send className="w-4 h-4 text-sky-400" /> Pitch to founders / seniors
        </h3>
        <Card>
          {sent ? (
            <div>
              <p className="text-sm text-green-400">
                Pitch sent — a {audience === "Founders" ? "founder" : "senior"} will follow up over email.
              </p>
              <button
                onClick={() => {
                  setSent(false);
                  setTitle("");
                  setPitch("");
                }}
                className="mt-4 px-4 py-2 rounded-lg border border-white/15 bg-white/5 text-sm text-white/60 hover:text-white transition-colors"
              >
                Send another pitch
              </button>
            </div>
          ) : (
            <form onSubmit={submitPitch} className="space-y-3">
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Idea title"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm placeholder:text-white/25 focus:outline-none focus:border-sky-400/50 focus:ring-1 focus:ring-sky-400/30"
              />
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-sky-400/50"
              >
                <option>Founders</option>
                <option>Wing seniors</option>
                <option>Faculty mentors</option>
              </select>
              <textarea
                required
                rows={4}
                value={pitch}
                onChange={(e) => setPitch(e.target.value)}
                placeholder="Describe your idea, what you need, and why it matters…"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm placeholder:text-white/25 focus:outline-none focus:border-sky-400/50 focus:ring-1 focus:ring-sky-400/30"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-black text-sm font-semibold transition-colors"
              >
                Send pitch
              </button>
            </form>
          )}
        </Card>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-sky-400" /> Mentors & resource persons
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {MENTORS.map((m) => (
            <Card key={m.id}>
              <p className="text-sm font-medium">{m.name}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {m.tags.map((t) => (
                  <Pill key={t}>{t}</Pill>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// =========================================================
// TAB: RESOURCES  (unchanged)
// =========================================================

function ResourcesTab() {
  const [fromWing, setFromWing] = useState("CSE Wing");
  const [toWing, setToWing] = useState("Electronics Wing");
  const [reason, setReason] = useState("");
  const [requested, setRequested] = useState(false);

  function submitSwitch(e: FormEvent) {
    e.preventDefault();
    setRequested(true);
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
          <Wrench className="w-4 h-4 text-sky-400" /> Equipment & lab booking
        </h3>
        <Card>
          <ul className="divide-y divide-white/5">
            {EQUIPMENT.map((e) => (
              <li key={e.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                <span className="text-sm">{e.name}</span>
                <div className="flex items-center gap-3">
                  <Pill tone={e.status === "Available" ? "green" : "yellow"}>{e.status}</Pill>
                  <button
                    disabled={e.status !== "Available"}
                    className="px-3 py-1 rounded-lg bg-sky-400/10 border border-sky-400/30 text-sky-400 text-xs font-medium hover:bg-sky-400/20 disabled:opacity-30 disabled:hover:bg-sky-400/10 transition-colors"
                  >
                    Book
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-sky-400" /> Internship & job board
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {JOBS.map((j) => (
            <Card key={j.id}>
              <p className="text-sm font-medium">{j.title}</p>
              <p className="text-xs text-white/40 mt-0.5">{j.org}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {j.tags.map((t) => (
                  <Pill key={t}>{t}</Pill>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-sky-400" /> Cross-domain / wing switch request
        </h3>
        <Card>
          {requested ? (
            <p className="text-sm text-green-400">
              Request submitted — your current and target wing leads have been notified.
            </p>
          ) : (
            <form onSubmit={submitSwitch} className="space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <select
                  value={fromWing}
                  onChange={(e) => setFromWing(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-sky-400/50"
                >
                  <option>CSE Wing</option>
                  <option>Electronics Wing</option>
                  <option>Rocketry Wing</option>
                  <option>Mechatronics Wing</option>
                </select>
                <select
                  value={toWing}
                  onChange={(e) => setToWing(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-sky-400/50"
                >
                  <option>Electronics Wing</option>
                  <option>CSE Wing</option>
                  <option>Rocketry Wing</option>
                  <option>Mechatronics Wing</option>
                </select>
              </div>
              <textarea
                required
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why do you want to switch?"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm placeholder:text-white/25 focus:outline-none focus:border-sky-400/50 focus:ring-1 focus:ring-sky-400/30"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-black text-sm font-semibold transition-colors"
              >
                Submit request
              </button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

// =========================================================
// PAGE
// =========================================================

type Tab = "pitch" | "resources";

const TABS: { key: Tab; label: string }[] = [
  { key: "pitch", label: "Pitch" },
  { key: "resources", label: "Resources" },
];

function CommunityPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("pitch");

  // ---- auth check (mirrors dashboard.tsx, cached to avoid flicker) ----
  const isAuthCacheFresh = readAuthCache();
  const [checkingAuth, setCheckingAuth] = useState(!isAuthCacheFresh);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function verifyMember() {
      const token = getStoredToken();

      if (!token) {
        if (!cancelled) {
          clearAuthCache();
          setCheckingAuth(false);
          navigate({ to: "/login", replace: true });
        }
        return;
      }

      // Already verified recently — render immediately and
      // just revalidate quietly in the background below.
      if (isAuthCacheFresh) {
        setCheckingAuth(false);
      }

      try {
        const verifyResponse = await fetch(`${API_URL}/member/verify`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!verifyResponse.ok) {
          throw new Error("Invalid or expired token");
        }

        const verifyData = await verifyResponse.json();

        if (verifyData.role !== "member") {
          throw new Error("Member access required");
        }

        if (!cancelled) {
          writeAuthCache();
          setAuthError("");
          setCheckingAuth(false);
        }
      } catch (error) {
        console.error("Member authentication failed:", error);

        if (!cancelled) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("userName");
          localStorage.removeItem("userEmail");
          localStorage.removeItem("userWing");
          localStorage.removeItem("userRole");
          clearAuthCache();

          setAuthError("Your session is invalid or expired.");
          setCheckingAuth(false);

          navigate({ to: "/login", replace: true });
        }
      }
    }

    verifyMember();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-sky-400/30 border-t-sky-400 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-white/50 mt-4">Verifying member credentials...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <p className="text-sm text-red-400">{authError}</p>
      </div>
    );
  }
  // ---- end auth check ----

  return (
    <SiteShell>
      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 900px 500px at 50% 0%, rgba(59,130,246,0.10), transparent 70%)",
          }}
        />

        <DashboardNav active="community" />

        <main className="relative z-10 max-w-6xl mx-auto px-6 py-12">
          <p className="text-xs font-mono tracking-widest text-sky-400 mb-2">/ COMMUNITY</p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Pitch ideas, share{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(90deg, #F97316, #FACC15, #22C55E, #38BDF8)",
              }}
            >
              resources
            </span>
          </h1>
          <p className="text-white/50 mb-8">
            Take your idea to the founders and book what you need to build it.
          </p>

          <div className="inline-flex p-1 rounded-lg border border-white/10 bg-white/[0.02] mb-8 flex-wrap">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  tab === t.key ? "bg-sky-400 text-black" : "text-white/50 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "pitch" && <PitchTab />}
          {tab === "resources" && <ResourcesTab />}
        </main>
      </div>
    </SiteShell>
  );
}