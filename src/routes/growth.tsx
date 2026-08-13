import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  BookOpen,
  GraduationCap,
  FolderKanban,
  ClipboardList,
  Award,
  Download,
  CheckCircle2,
  Circle,
  Sparkles,
  ArrowLeft,
  Info,
  Search,
  UserPlus,
  Users,
  Plus,
  Send,
  X,
  Play,
  Terminal,
  Code2,
  ArrowRight,
} from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { DashboardNav } from "@/components/navbar";
export const Route = createFileRoute("/growth")({
  head: () => ({
    meta: [
      { title: "Growth · CREST" },
      {
        name: "description",
        content:
          "Learn, build and track your progress inside CREST — workshops, technical and non-technical events, projects and achievements.",
      },
      { property: "og:title", content: "Growth · CREST" },
      {
        property: "og:description",
        content:
          "Workshops with an in-browser compiler, team-based technical and non-technical events, projects and achievements.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GrowthPage,
});

// =========================================================
// AUTH HELPERS
// =========================================================

const API_URL = "https://crest-b6rg.onrender.com";

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-white/10 bg-white/[0.03] p-4 ${className}`}>{children}</div>;
}

function Pill({ children, tone = "white" }: { children: ReactNode; tone?: "white" | "sky" | "green" | "yellow" | "red" }) {
  const tones = {
    white: "border-white/10 bg-white/5 text-white/60", sky: "border-sky-400/20 bg-sky-400/10 text-sky-400",
    green: "border-green-400/20 bg-green-400/10 text-green-400", yellow: "border-yellow-400/20 bg-yellow-400/10 text-yellow-300",
    red: "border-red-400/20 bg-red-400/10 text-red-400",
  };
  return <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-medium ${tones[tone]}`}>{children}</span>;
}

function statusTone(status: string): "white" | "sky" | "green" | "yellow" | "red" {
  const v = status.toLowerCase();
  if (v === "ongoing") return "green"; if (v === "upcoming") return "yellow"; if (v === "completed") return "sky"; return "white";
}

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
// API TYPES / HELPERS
// =========================================================

type Category = "workshop" | "technical" | "non-technical";
type LearningType = "course" | "roadmap";

type TeamRegistration = {
  id: string;
  team: string;
  leader: string;
  leaderEmail: string;
  email: string;
  members: string;
  memberEmails: string[];
  memberList: { email: string; name: string; wing: string }[];
  submitted: string;
  status: string;
};

type Workshop = {
  id: string;
  name: string;
  title?: string;
  type?: string;
  kind: "workshop" | "event";
  category?: Category;
  status: string;
  enrolled: boolean;
  date: string;
  lastDate: string;
  maxTeam: number;
  minTeam: number;
  instructions: string[];
  instructionsText?: string;
  registrations: TeamRegistration[];
  question?: {
    title: string;
    prompt: string;
    starter: string;
    expectedOutput: string;
  } | null;
  winnerEmail?: string | null;
  winnerName?: string | null;
  winnerStatus?: string | null;
  myRegistration?: string | null;
};

type LearningItem = {
  id: string;
  type: LearningType;
  title: string;
  name: string;
  skill: string;
  track: string;
  detail: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  mentor: string;
  link: string;
  progress: number;
  steps?: { id?: string; title: string; link: string; description?: string }[];
};

type Assignment = {
  id: string;
  title: string;
  name: string;
  description: string;
  wing: string;
  link: string;
  dueDate: string;
  completion: {
    status: "pending" | "completed";
    answer: string;
    submittedAt: string | null;
  };
};

type MemberDirectoryItem = {
  id: string;
  name: string;
  email: string;
  wing: string;
  skills: string[];
};

type Project = {
  id: number;
  name: string;
  owner: string;
  desc: string;
  stack: string[];
  needs: string[];
  mine: boolean;
};

const ROLE_OPTIONS = [
  "Frontend Dev",
  "Backend Dev",
  "UI/UX",
  "AI/ML",
  "Embedded C",
  "PCB Design",
  "CAD",
  "Robotics",
  "Content / Docs",
];

const INITIAL_PROJECTS: Project[] = [
  {
    id: 1,
    name: "CREST Member Dashboard",
    owner: "You",
    desc: "Internal dashboard for member self-service.",
    stack: ["React", "FastAPI", "MongoDB"],
    needs: ["Backend Dev", "UI/UX"],
    mine: true,
  },
  {
    id: 2,
    name: "Line-follower Bot",
    owner: "Ishita Rao",
    desc: "Personal build for the Electronics wing showcase.",
    stack: ["Arduino", "C++"],
    needs: ["Embedded C", "PCB Design"],
    mine: false,
  },
  {
    id: 3,
    name: "Campus Event Recommender",
    owner: "Sanya Gupta",
    desc: "ML model that suggests events based on member skills.",
    stack: ["Python", "scikit-learn"],
    needs: ["AI/ML", "Frontend Dev"],
    mine: false,
  },
];

const BADGES = ["Hackathon Ready", "Mentor Verified", "Full Stack", "Early Adopter"];

const APPLICANT_STAGES = ["Applied", "Shortlisted", "Result"];

async function memberFetch(url: string, options: RequestInit = {}) {
  const token = getStoredToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

function normalizeEvent(event: any): Workshop {
  return {
    ...event,
    id: String(event.id),
    name: event.name ?? event.title ?? "",
    title: event.title ?? event.name ?? "",
    kind: event.kind ?? (event.category === "workshop" ? "workshop" : "event"),
    category:
      event.category ??
      (event.kind === "workshop" ? "workshop" : "technical"),
    status: event.status ?? "Upcoming",
    enrolled: Boolean(event.myRegistration),
    date: event.date ?? event.lastDate ?? "",
    lastDate: event.lastDate ?? event.date ?? "",
    instructions: Array.isArray(event.instructions)
      ? event.instructions
      : event.instructions
        ? String(event.instructions).split("\n").filter(Boolean)
        : [],
    registrations: event.registrations ?? [],
    question: event.question ?? null,
  };
}

// =========================================================
// TEAM BUILDER
// =========================================================

function TeamBuilder({
  event,
  onUpdated,
}: {
  event: Workshop;
  onUpdated: (event: Workshop) => void;
}) {
  const [mode, setMode] = useState<"create" | "join">("create");
  const [teamName, setTeamName] = useState("");
  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<MemberDirectoryItem[]>([]);
  const [invited, setInvited] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [requestedTeams, setRequestedTeams] = useState<string[]>([]);

  const teamSize = 1 + invited.length;
  const seatsLeft = event.maxTeam - teamSize;

  useEffect(() => {
    let cancelled = false;

    async function searchMembers() {
      if (!query.trim()) {
        setMembers([]);
        return;
      }

      try {
        const response = await memberFetch(
          `${API_URL}/growth/members?query=${encodeURIComponent(query)}`
        );
        if (!response.ok) return;

        const data = await response.json();
        if (!cancelled) setMembers(data);
      } catch {
        if (!cancelled) setMembers([]);
      }
    }

    searchMembers();

    return () => {
      cancelled = true;
    };
  }, [query]);

  function toggleInvite(email: string) {
    setInvited((prev) =>
      prev.includes(email)
        ? prev.filter((item) => item !== email)
        : seatsLeft > 0
          ? [...prev, email]
          : prev
    );
  }

  async function createTeam() {
    if (event.status.toLowerCase() !== "ongoing") { alert("This event is not open yet. Admin must mark it Ongoing first."); return; }
    if (!teamName.trim()) {
      alert("Enter a team name.");
      return;
    }

    if (teamSize < event.minTeam || teamSize > event.maxTeam) {
      alert(`Team size must be between ${event.minTeam} and ${event.maxTeam}.`);
      return;
    }

    try {
      setLoading(true);

      const response = await memberFetch(
        `${API_URL}/growth/events/${event.id}/teams`,
        {
          method: "POST",
          body: JSON.stringify({
            team: teamName.trim(),
            memberEmails: invited,
          }),
        }
      );

      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || "Failed to create team");
      }

      const data = await response.json();
      onUpdated(normalizeEvent(data.event));
      setTeamName("");
      setInvited([]);
      setMode("join");
      alert("Team registered successfully.");
    } catch (error) {
      console.error(error);
      alert("Failed to create the team.");
    } finally {
      setLoading(false);
    }
  }

  async function joinTeam(teamId: string) {
    if (event.status.toLowerCase() !== "ongoing") { alert("This event is not open yet."); return; }
    try {
      setLoading(true);

      const response = await memberFetch(
        `${API_URL}/growth/events/${event.id}/teams/${teamId}/join`,
        { method: "POST" }
      );

      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || "Failed to join team");
      }

      const refreshed = await memberFetch(`${API_URL}/growth/events`);
      if (refreshed.ok) {
        const all = await refreshed.json();
        const updated = all.map(normalizeEvent).find((item: Workshop) => item.id === event.id);
        if (updated) onUpdated(updated);
      }

      setRequestedTeams((prev) => [...prev, teamId]);
    } catch (error) {
      console.error(error);
      alert("Failed to join the team.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-lg border border-white/10 bg-white/[0.03] p-1">
        <button
          onClick={() => setMode("create")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium ${
            mode === "create" ? "bg-sky-400 text-black" : "text-white/50 hover:text-white"
          }`}
        >
          Make a team
        </button>
        <button
          onClick={() => setMode("join")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium ${
            mode === "join" ? "bg-sky-400 text-black" : "text-white/50 hover:text-white"
          }`}
        >
          Join a team ({event.registrations.length})
        </button>
      </div>

      {mode === "create" ? (
        <>
          <Card>
            <label className="text-sm font-medium text-white">Team name</label>
            <input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Team Nebula"
              className="mt-2 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-sky-400/50 focus:outline-none"
            />

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-white">Search members by skill</span>
                <span className="text-[11px] text-white/40">
                  {teamSize}/{event.maxTeam} members
                </span>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Try Backend Dev, PCB Design, AI/ML..."
                  className="w-full rounded-lg border border-white/10 bg-black/40 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/25 focus:border-sky-400/50 focus:outline-none"
                />
              </div>

              {members.length > 0 && (
                <div className="mt-3 space-y-2">
                  {members.map((member) => {
                    const selected = invited.includes(member.email);

                    return (
                      <div
                        key={member.email}
                        className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2.5"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-400/15 text-xs font-semibold text-sky-400">
                            {initialsOf(member.name)}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-white">{member.name}</p>
                            <p className="text-[11px] text-white/40">
                              {member.wing} · {member.skills.join(", ")}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => toggleInvite(member.email)}
                          disabled={!selected && seatsLeft <= 0}
                          className={`rounded-lg border px-3 py-1.5 text-xs ${
                            selected
                              ? "border-green-400/30 bg-green-400/10 text-green-400"
                              : "border-sky-400/30 bg-sky-400/10 text-sky-400 disabled:opacity-30"
                          }`}
                        >
                          {selected ? "Selected" : "Add"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>

          <Card>
            <p className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
              <Users className="h-4 w-4 text-sky-400" /> Your roster
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2.5">
                <span>You · Team lead</span>
                <Pill tone="green">Confirmed</Pill>
              </div>

              {invited.map((email) => {
                const member = members.find((item) => item.email === email);

                return (
                  <div
                    key={email}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2.5"
                  >
                    <span className="text-sm text-white/80">
                      {member?.name ?? email}
                    </span>
                    <button
                      onClick={() => toggleInvite(email)}
                      className="text-white/30 hover:text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}

              <p className="text-[11px] text-white/35">
                {seatsLeft} seat{seatsLeft === 1 ? "" : "s"} left.
              </p>
            </div>
          </Card>

          <button
            disabled={loading}
            onClick={createTeam}
            className="rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-40"
          >
            {loading ? "Saving..." : "Register team"}
          </button>
        </>
      ) : (
        <div className="space-y-3">
          {event.registrations.length === 0 ? (
            <Card>
              <p className="text-sm text-white/40">No teams have registered yet.</p>
            </Card>
          ) : (
            event.registrations.map((team) => {
              const requested = requestedTeams.includes(team.id);
              const full = team.memberEmails.length >= event.maxTeam;

              return (
                <Card key={team.id} className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-white">{team.team}</p>
                    <p className="mt-1 text-xs text-white/45">
                      Lead: {team.leader} · {team.memberEmails.length}/{event.maxTeam} members
                    </p>
                  </div>

                  <button
                    disabled={requested || full || loading}
                    onClick={() => joinTeam(team.id)}
                    className={`rounded-lg border px-4 py-2 text-xs ${
                      requested
                        ? "border-green-400/30 bg-green-400/10 text-green-400"
                        : "border-sky-400/30 bg-sky-400/10 text-sky-400 disabled:opacity-30"
                    }`}
                  >
                    {requested ? "Joined" : full ? "Full" : "Join team"}
                  </button>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// =========================================================
// WORKSHOP DETAIL — TEAM + COMPILER
// =========================================================

function WorkshopDetail({
  event,
  onBack,
  onUpdated,
}: {
  event: Workshop;
  onBack: () => void;
  onUpdated: (event: Workshop) => void;
}) {
  const question = event.question ?? {
    title: "Practice question",
    prompt: "Solve the problem shared during the session.",
    starter: 'console.log("Hello CREST");',
    expectedOutput: "",
  };

  const [code, setCode] = useState(question.starter);
  const [output, setOutput] = useState<string[]>([]);
  const [errored, setErrored] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function run() {
    const logs: string[] = [];
    setErrored(false);

    try {
      const fakeConsole = {
        log: (...args: unknown[]) =>
          logs.push(
            args
              .map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
              .join(" ")
          ),
      };

      // eslint-disable-next-line no-new-func
      const fn = new Function("console", code);
      fn(fakeConsole);

      if (logs.length === 0) logs.push("(no output)");
    } catch (err) {
      setErrored(true);
      logs.push(String(err));
    }

    setOutput(logs);
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Learn
      </button>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={statusTone(event.status)}>{event.status}</Pill>
          <Pill tone={event.enrolled ? "green" : "white"}>
            {event.enrolled ? "Enrolled" : "Not enrolled"}
          </Pill>
          <Pill>Team of {event.minTeam}–{event.maxTeam}</Pill>
        </div>

        <h2 className="mt-3 text-3xl font-semibold text-white">{event.name}</h2>
        <p className="text-sm text-white/45">{event.date}</p>
      </div>

      <Card>
        <p className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
          <Info className="h-4 w-4 text-sky-400" /> Instructions
        </p>
        <ul className="space-y-2">
          {event.instructions.map((instruction) => (
            <li key={instruction} className="flex gap-2 text-sm text-white/55">
              <span className="mt-2 h-1 w-1 rounded-full bg-sky-400" />
              {instruction}
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
            <ClipboardList className="h-4 w-4 text-sky-400" /> {question.title}
          </p>
          <p className="text-sm leading-relaxed text-white/55">{question.prompt}</p>

          {question.expectedOutput && (
            <div className="mt-4 rounded-lg border border-green-400/20 bg-green-400/5 p-3">
              <p className="text-[10px] uppercase tracking-widest text-green-400">
                Expected output
              </p>
              <pre className="mt-2 whitespace-pre-wrap text-xs text-white/70">
                {question.expectedOutput}
              </pre>
            </div>
          )}

          <button
            onClick={() => setSubmitted(true)}
            className="mt-4 w-full rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-black"
          >
            {submitted ? "Solution submitted" : "Submit solution"}
          </button>
        </Card>

        <div className="space-y-4 lg:col-span-3">
          <Card className="p-0">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
              <span className="flex items-center gap-2 text-xs font-medium text-white/50">
                <Code2 className="h-4 w-4 text-sky-400" /> main.js
              </span>
              <button
                onClick={run}
                className="flex items-center gap-1.5 rounded-lg border border-sky-400/30 bg-sky-400/10 px-3 py-1.5 text-xs text-sky-400"
              >
                <Play className="h-3.5 w-3.5" /> Run
              </button>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              rows={14}
              className="w-full resize-y bg-black/40 px-4 py-3 font-mono text-[13px] leading-relaxed text-white/80 focus:outline-none"
            />
          </Card>

          <Card className="p-0">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5 text-xs font-medium text-white/50">
              <Terminal className="h-4 w-4 text-sky-400" /> Output
            </div>
            <pre
              className={`min-h-[96px] overflow-x-auto whitespace-pre-wrap px-4 py-3 font-mono text-[13px] ${
                errored ? "text-red-400" : "text-white/70"
              }`}
            >
              {output.length ? output.join("\n") : "Run your code to see the output."}
            </pre>
          </Card>
        </div>
      </div>

      <Card>
        <p className="mb-4 text-sm font-medium text-white">Workshop team</p>
        <TeamBuilder event={event} onUpdated={onUpdated} />
      </Card>
    </div>
  );
}

// =========================================================
// EVENT DETAIL — TEAM BUILDING
// =========================================================

function EventDetail({
  event,
  onBack,
  onUpdated,
}: {
  event: Workshop;
  onBack: () => void;
  onUpdated: (event: Workshop) => void;
}) {
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Learn
      </button>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={statusTone(event.status)}>{event.status}</Pill>
          <Pill tone={event.enrolled ? "green" : "white"}>
            {event.enrolled ? "Enrolled" : "Not enrolled"}
          </Pill>
          <Pill>Team of {event.minTeam}–{event.maxTeam}</Pill>
        </div>
        <h2 className="mt-3 text-3xl font-semibold text-white">{event.name}</h2>
        <p className="text-sm text-white/45">{event.date}</p>
      </div>

      <Card>
        <p className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
          <Info className="h-4 w-4 text-sky-400" /> Instructions
        </p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/55">
          {event.instructions.join("\n")}
        </p>
      </Card>

      <TeamBuilder event={event} onUpdated={onUpdated} />

      {event.winnerName && (
        <Card>
          <p className="text-sm font-medium text-white">Event result</p>
          <p className="mt-2 text-sm text-green-400">
            Winner: {event.winnerName}
          </p>
        </Card>
      )}
    </div>
  );
}

// =========================================================
// TAB CONTENT: LEARN
// =========================================================

function EventCard({ w, onOpen }: { w: Workshop; onOpen: () => void }) {
  const locked = w.status.toLowerCase() === "upcoming";
  return (
    <button onClick={locked ? undefined : onOpen} disabled={locked} className={`text-left ${locked ? "cursor-not-allowed opacity-60" : ""}`}>
      <Card className={`h-full transition-colors ${locked ? "" : "hover:border-sky-400/30"}`}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Pill tone={statusTone(w.status)}>{w.status}</Pill>
          <Pill tone={w.enrolled ? "green" : "white"}>{w.enrolled ? "Enrolled" : "Not enrolled"}</Pill>
        </div>
        <p className="text-base font-semibold text-white">{w.name}</p>
        <p className="mt-1 text-xs text-white/45">{w.category === "non-technical" ? "Non-technical event" : w.category === "technical" ? "Technical event" : "Workshop"}{" · "}{w.date}</p>
        <p className="mt-3 text-[11px] text-sky-400">{locked ? "Available when the admin starts it" : w.kind === "workshop" ? `Team workshop · ${w.minTeam}–${w.maxTeam} members →` : `Team event · ${w.minTeam}–${w.maxTeam} members →`}</p>
      </Card>
    </button>
  );
}

function LearnTab() {
  const [events, setEvents] = useState<Workshop[]>([]);
  const [learning, setLearning] = useState<LearningItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openEvent, setOpenEvent] = useState<Workshop | null>(null);

  async function loadLearnData() {
    try {
      setLoading(true);

      const [eventsResponse, learningResponse] = await Promise.all([
        memberFetch(`${API_URL}/growth/events`),
        memberFetch(`${API_URL}/growth/learning`),
      ]);

      if (!eventsResponse.ok || !learningResponse.ok) {
        throw new Error("Failed to load growth learning data");
      }

      const eventData = await eventsResponse.json();
      const learningData = await learningResponse.json();

      setEvents(eventData.map(normalizeEvent));
      setLearning(learningData);
    } catch (error) {
      console.error("Failed to load Learn data:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLearnData();
  }, []);

  if (openEvent) {
    const onUpdated = (updated: Workshop) => {
      setEvents((prev) => prev.map((item) => item.id === updated.id ? updated : item));
      setOpenEvent(updated);
    };

    return openEvent.kind === "workshop" ? (
      <WorkshopDetail
        event={openEvent}
        onBack={() => setOpenEvent(null)}
        onUpdated={onUpdated}
      />
    ) : (
      <EventDetail
        event={openEvent}
        onBack={() => setOpenEvent(null)}
        onUpdated={onUpdated}
      />
    );
  }

  const workshops = events.filter((event) => event.kind === "workshop");
  const technical = events.filter(
    (event) => event.category === "technical" || event.category === "non-technical"
  );

  if (loading) {
    return <p className="text-sm text-white/40">Loading growth content...</p>;
  }

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-3 flex items-baseline gap-3">
          <h3 className="flex items-center gap-2 text-sm font-medium text-white">
            <BookOpen className="h-4 w-4 text-sky-400" /> Workshops
          </h3>
          <span className="text-[11px] text-white/35">Team based workshops</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {workshops.map((event) => (
            <EventCard
              key={event.id}
              w={event}
              onOpen={() => setOpenEvent(event)}
            />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-baseline gap-3">
          <h3 className="flex items-center gap-2 text-sm font-medium text-white">
            <Users className="h-4 w-4 text-sky-400" /> Events
          </h3>
          <span className="text-[11px] text-white/35">Technical and non-technical team events</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {technical.map((event) => (
            <EventCard
              key={event.id}
              w={event}
              onOpen={() => setOpenEvent(event)}
            />
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-white"><GraduationCap className="h-4 w-4 text-sky-400" /> Skill Building Courses</h3>
        <p className="mb-4 text-xs text-white/40">Each item is a complete top-to-bottom roadmap. Admin can add a link to every step.</p>
        <div className="grid gap-4 lg:grid-cols-2">
          {learning.map((item) => (
            <Card key={item.id}>
              <div className="flex items-center justify-between gap-2"><Pill tone="sky">Skill Building</Pill><Pill>{item.skill || item.track || "General"}</Pill></div>
              <p className="mt-3 text-lg font-semibold text-white">{item.title}</p>
              {item.detail && <p className="mt-2 text-xs leading-relaxed text-white/45">{item.detail}</p>}
              <div className="mt-2 text-[11px] text-white/40">{item.level} · {item.duration || "Self-paced"}{item.mentor ? ` · ${item.mentor}` : ""}</div>
              <div className="mt-5">
                {(item.steps?.length ? item.steps : [{ title: item.title, link: item.link || "", description: item.detail }]).map((step, index, arr) => (
                  <div key={`${item.id}-${index}`} className="flex gap-3">
                    <div className="flex w-8 shrink-0 flex-col items-center"><div className="z-10 flex h-7 w-7 items-center justify-center rounded-full border border-sky-400/30 bg-sky-400/10 text-[10px] font-bold text-sky-300">{index + 1}</div>{index < arr.length - 1 && <div className="h-full min-h-10 w-px bg-sky-400/20" />}</div>
                    <div className="mb-4 min-w-0 flex-1 rounded-lg border border-white/10 bg-black/20 p-3">
                      <p className="text-sm font-medium text-white">{step.title}</p>{step.description && <p className="mt-1 text-xs text-white/40">{step.description}</p>}
                      {step.link ? <a href={step.link} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-sky-400 hover:text-sky-300">Open step <ArrowRight className="h-3.5 w-3.5" /></a> : <span className="mt-2 block text-[11px] text-white/25">No link added</span>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
        {learning.length === 0 && <Card><p className="text-sm text-white/40">No skill-building courses have been published yet.</p></Card>}
      </section>
    </div>
  );
}

// =========================================================
// TAB CONTENT: BUILD (projects marketplace)
// =========================================================

function NewProjectForm({ onCreate }: { onCreate: (p: Project) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [stack, setStack] = useState("");
  const [needs, setNeeds] = useState<string[]>([]);

  function toggleNeed(role: string) {
    setNeeds((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    onCreate({
      id: Date.now(),
      name,
      owner: "You",
      desc,
      stack: stack.split(",").map((s) => s.trim()).filter(Boolean),
      needs,
      mine: true,
    });
    setName("");
    setDesc("");
    setStack("");
    setNeeds([]);
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-sky-400"
      >
        <Plus className="h-4 w-4" /> Add project
      </button>
    );
  }

  return (
    <Card className="w-full">
      <form onSubmit={submit} className="space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Project name"
          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-sky-400/50 focus:outline-none"
        />
        <input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="What are you building?"
          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-sky-400/50 focus:outline-none"
        />
        <input
          value={stack}
          onChange={(e) => setStack(e.target.value)}
          placeholder="Tech stack, comma separated (React, FastAPI…)"
          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-sky-400/50 focus:outline-none"
        />
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-widest text-white/35">Roles you need</p>
          <div className="flex flex-wrap gap-1.5">
            {ROLE_OPTIONS.map((r) => {
              const on = needs.includes(r);
              return (
                <button
                  type="button"
                  key={r}
                  onClick={() => toggleNeed(r)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                    on
                      ? "border-sky-400/40 bg-sky-400/15 text-sky-400"
                      : "border-white/15 bg-white/5 text-white/50 hover:text-white"
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-sky-400"
          >
            Publish project
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/60 transition-colors hover:text-white"
          >
            Cancel
          </button>
        </div>
      </form>
    </Card>
  );
}

function BuildTab() {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [roleFilter, setRoleFilter] = useState("All");
  const [requests, setRequests] = useState<Record<string, boolean>>({});
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentAnswers, setAssignmentAnswers] = useState<Record<string, string>>({});
  const [assignmentLoading, setAssignmentLoading] = useState(true);
  const [submittingAssignment, setSubmittingAssignment] = useState<string | null>(null);

  const visible = projects.filter(
    (project) => roleFilter === "All" || project.needs.includes(roleFilter)
  );

  async function loadAssignments() {
    try {
      setAssignmentLoading(true);

      const response = await memberFetch(`${API_URL}/growth/assignments`);
      if (!response.ok) {
        throw new Error("Failed to load assignments");
      }

      const data = await response.json();
      setAssignments(data);
      setAssignmentAnswers(
        Object.fromEntries(
          data.map((assignment: Assignment) => [
            assignment.id,
            assignment.completion?.answer ?? "",
          ])
        )
      );
    } catch (error) {
      console.error("Failed to load assignments:", error);
    } finally {
      setAssignmentLoading(false);
    }
  }

  useEffect(() => {
    loadAssignments();
  }, []);

  async function submitAssignment(assignment: Assignment) {
    try {
      setSubmittingAssignment(assignment.id);

      const response = await memberFetch(
        `${API_URL}/growth/assignments/${assignment.id}/submit`,
        {
          method: "POST",
          body: JSON.stringify({
            answer: assignmentAnswers[assignment.id] ?? "",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      await loadAssignments();
    } catch (error) {
      console.error("Assignment submission failed:", error);
      alert("Failed to save assignment completion.");
    } finally {
      setSubmittingAssignment(null);
    }
  }

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-sm font-medium text-white">
            <FolderKanban className="h-4 w-4 text-sky-400" /> Projects
          </h3>

          <NewProjectForm
            onCreate={(project) => setProjects((prev) => [project, ...prev])}
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {["All", ...ROLE_OPTIONS].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`rounded-full border px-2.5 py-1 text-[11px] ${
                roleFilter === role
                  ? "border-sky-400/40 bg-sky-400/15 text-sky-400"
                  : "border-white/15 bg-white/5 text-white/50 hover:text-white"
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((project) => (
            <Card key={project.id}>
              <p className="text-[11px] uppercase tracking-widest text-white/35">
                {project.mine ? "Your project" : project.owner}
              </p>

              <p className="mt-2 text-base font-semibold text-white">
                {project.name}
              </p>

              <p className="mt-1 text-xs text-white/45">{project.desc}</p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {project.stack.map((stack) => (
                  <Pill key={stack}>{stack}</Pill>
                ))}
              </div>

              <p className="mt-4 text-[11px] uppercase tracking-widest text-white/35">
                Roles needed
              </p>

              <div className="mt-2 space-y-2">
                {project.needs.length === 0 && (
                  <p className="text-xs text-white/40">Team complete.</p>
                )}

                {project.needs.map((need) => {
                  const key = `${project.id}-${need}`;
                  const sent = requests[key];

                  return (
                    <div
                      key={need}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="text-sm text-white/70">{need}</span>

                      {project.mine ? (
                        <Pill tone="yellow">Open</Pill>
                      ) : (
                        <button
                          onClick={() =>
                            setRequests((prev) => ({
                              ...prev,
                              [key]: true,
                            }))
                          }
                          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs ${
                            sent
                              ? "border-green-400/30 bg-green-400/10 text-green-400"
                              : "border-sky-400/30 bg-sky-400/10 text-sky-400"
                          }`}
                        >
                          <Send className="h-3.5 w-3.5" />
                          {sent ? "Requested" : "Request"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
          <ClipboardList className="h-4 w-4 text-sky-400" /> Assignments
        </h3>

        {assignmentLoading ? (
          <Card>
            <p className="text-sm text-white/40">Loading assignments...</p>
          </Card>
        ) : assignments.length === 0 ? (
          <Card>
            <p className="text-sm text-white/40">
              No assignments are currently assigned to your wing.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {assignments.map((assignment) => {
              const completed = assignment.completion?.status === "completed";

              return (
                <Card key={assignment.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {assignment.title}
                      </p>
                      <p className="mt-1 text-[11px] text-sky-400">
                        {assignment.wing}
                        {assignment.dueDate ? ` · Due ${assignment.dueDate}` : ""}
                      </p>
                    </div>

                    <Pill tone={completed ? "green" : "yellow"}>
                      {completed ? "Completed" : "Pending"}
                    </Pill>
                  </div>

                  {assignment.description && (
                    <p className="mt-3 text-sm leading-relaxed text-white/50">
                      {assignment.description}
                    </p>
                  )}

                  {assignment.link && (
                    <a
                      href={assignment.link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-xs text-sky-400"
                    >
                      Open assignment link <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  )}

                  <textarea
                    value={assignmentAnswers[assignment.id] ?? ""}
                    onChange={(event) =>
                      setAssignmentAnswers((prev) => ({
                        ...prev,
                        [assignment.id]: event.target.value,
                      }))
                    }
                    placeholder="Write your submission or completion note..."
                    className="mt-4 min-h-24 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-sky-400/40 focus:outline-none"
                  />

                  <button
                    disabled={submittingAssignment === assignment.id}
                    onClick={() => submitAssignment(assignment)}
                    className="mt-3 rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-black disabled:opacity-40"
                  >
                    {submittingAssignment === assignment.id
                      ? "Saving..."
                      : completed
                        ? "Update completion"
                        : "Mark completed"}
                  </button>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

// =========================================================
// TAB CONTENT: ACHIEVE
// =========================================================

function contributionLevel(i: number) {
  const seed = (i * 2654435761) % 4294967296;
  return Math.abs(seed >>> 26) % 4;
}

function AchieveTab() {
  const [achievements, setAchievements] = useState<
    { id: string; name: string; year: string; status: string }[]
  >([]);
  const [applicantStatus, setApplicantStatus] = useState("Shortlisted");
  const [memberEvents, setMemberEvents] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadAchievements() {
      try {
        const [achievementResponse, memberResponse, eventResponse] = await Promise.all([
          memberFetch(`${API_URL}/growth/achievements`),
          memberFetch(`${API_URL}/member/me`),
          memberFetch(`${API_URL}/growth/events`),
        ]);

        if (!achievementResponse.ok || !memberResponse.ok || !eventResponse.ok) {
          throw new Error("Failed to load achievement data");
        }

        const achievementData = await achievementResponse.json();
        const memberData = await memberResponse.json();
        const eventData = await eventResponse.json();

        if (!cancelled) {
          setMemberEvents(eventData.map(normalizeEvent).filter((event: Workshop) => event.enrolled));
          setAchievements(achievementData);
          setApplicantStatus(
            memberData.member?.applicantStatus ??
              memberData.member?.status ??
              "Shortlisted"
          );
        }
      } catch (error) {
        console.error("Failed to load achievements:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAchievements();

    return () => {
      cancelled = true;
    };
  }, []);

  const stageIndex =
    applicantStatus.toLowerCase() === "winner"
      ? 2
      : applicantStatus.toLowerCase() === "result"
        ? 2
        : applicantStatus.toLowerCase() === "shortlisted"
          ? 1
          : 0;

  const weeks = Array.from({ length: 26 });
  const levelColor = ["bg-white/5", "bg-sky-400/30", "bg-sky-400/60", "bg-sky-400"];

  if (loading) {
    return <p className="text-sm text-white/40">Loading achievements...</p>;
  }

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-sm font-medium text-white">
            <Award className="h-4 w-4 text-sky-400" /> Achievements
          </h3>

          <button className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/60 hover:text-white">
            <Download className="h-4 w-4" /> Export CREST Resume
          </button>
        </div>

        <Card>
          {achievements.length === 0 ? (
            <p className="text-sm text-white/40">
              No verified achievements yet.
            </p>
          ) : (
            <div className="space-y-3">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-sm text-white/80">
                    {achievement.name}
                  </span>
                  <Pill tone={achievement.status === "winner" ? "green" : "white"}>
                    {achievement.year}
                  </Pill>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium text-white">
          Contribution graph
        </h3>
        <Card>
          <div className="grid grid-flow-col grid-rows-7 gap-1">
            {weeks.flatMap((_, week) =>
              Array.from({ length: 7 }).map((__, day) => {
                const index = week * 7 + day;
                const level = Math.abs((index * 2654435761) >>> 26) % 4;

                return (
                  <span
                    key={index}
                    className={`h-3 w-3 rounded-[3px] ${levelColor[level]}`}
                  />
                );
              })
            )}
          </div>
          <p className="mt-3 text-[11px] text-white/35">
            Last 6 months of activity
          </p>
        </Card>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium text-white">
          Verified badges
        </h3>
        <div className="flex flex-wrap gap-2">
          {BADGES.map((badge) => (
            <span
              key={badge}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/70"
            >
              <Sparkles className="h-3.5 w-3.5 text-sky-400" />
              {badge}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium text-white">Event status</h3>
        <Card>{memberEvents.length === 0 ? <p className="text-sm text-white/40">You have not enrolled in any event yet.</p> : <div className="space-y-3">{memberEvents.map((event) => { const won = Boolean(event.winnerEmail && event.winnerEmail.toLowerCase() === (localStorage.getItem("userEmail") || "").toLowerCase()); return <div key={event.id} className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-medium text-white">{event.name}</p><p className="text-[11px] text-white/35">{event.category} · {event.status}</p></div><Pill tone={won ? "green" : "sky"}>{won ? "Won" : "Enrolled"}</Pill></div>; })}</div>}</Card>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium text-white">
          Applicant status
        </h3>
        <Card>
          <div className="flex flex-wrap items-center gap-3">
            {APPLICANT_STAGES.map((stage, index) => (
              <div key={stage} className="flex items-center gap-3">
                {index <= stageIndex ? (
                  <CheckCircle2 className="h-5 w-5 text-sky-400" />
                ) : (
                  <Circle className="h-5 w-5 text-white/25" />
                )}
                <span
                  className={`text-sm ${
                    index <= stageIndex ? "text-white" : "text-white/40"
                  }`}
                >
                  {stage}
                </span>
                {index < APPLICANT_STAGES.length - 1 && (
                  <span className="h-px w-8 bg-white/15" />
                )}
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs text-white/40">
            Current status: {applicantStatus}
          </p>
        </Card>
      </section>
    </div>
  );
}

// =========================================================
// PAGE
// =========================================================

type Tab = "learn" | "build" | "achieve";

const TABS: { key: Tab; label: string }[] = [
  { key: "learn", label: "Learn" },
  { key: "build", label: "Build" },
  { key: "achieve", label: "Achieve" },
];

function GrowthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("learn");

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
    
        <DashboardNav active="growth" />
        <div className="min-h-screen bg-[#07090c] text-white">
          <main className="mx-auto max-w-6xl px-5 py-12">
            <p className="text-[11px] uppercase tracking-[0.3em] text-sky-400">/ Growth</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Learn, build, and{" "}
              <span className="bg-gradient-to-r from-sky-400 to-sky-200 bg-clip-text text-transparent">
                track progress
              </span>
            </h1>
            <p className="mt-3 text-sm text-white/45">
              Everything tied to your personal development inside CREST.
            </p>

            <div className="mt-8 inline-flex rounded-lg border border-white/10 bg-white/[0.03] p-1">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                    tab === t.key ? "bg-sky-400 text-black" : "text-white/50 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            
            <div className="mt-8">
              {tab === "learn" && <LearnTab />}
              {tab === "build" && <BuildTab />}
              {tab === "achieve" && <AchieveTab />}
            </div>
          </main>
        </div>
      </div>  
    </SiteShell>    
  );
}