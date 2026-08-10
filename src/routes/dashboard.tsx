import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { DashboardNav } from "@/components/navbar";
import { useEffect, useState } from "react";
import {
  Bell,
  QrCode,
  Instagram,
  Linkedin,
  MessageCircle,
  Hash,
  ArrowRight,
  Sparkles,
  Users2,
  Trophy,
  Vote,
  Crown,
  KeyRound,
  Eye,
  EyeOff,
  X,
  ShieldCheck,
  Loader2,
  BookOpen,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard · CREST" }],
  }),
  component: DashboardOverview,
});

const API_URL = "http://127.0.0.1:8000";

// =========================================================
// TOKEN HELPER
// =========================================================

function getStoredToken(): string | null {
  const token = localStorage.getItem("accessToken");
  if (!token || token === "null" || token === "undefined") {
    return null;
  }
  return token;
}

// =========================================================
// MEMBER CACHE (avoids re-fetching on every dashboard visit)
// =========================================================

const MEMBER_CACHE_KEY = "crest_member_cache";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function readMemberCache(): { member: Member; cachedAt: number } | null {
  try {
    const raw = localStorage.getItem(MEMBER_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.member || !parsed?.cachedAt) return null;

    return parsed;
  } catch {
    return null;
  }
}

function writeMemberCache(member: Member) {
  try {
    localStorage.setItem(
      MEMBER_CACHE_KEY,
      JSON.stringify({ member, cachedAt: Date.now() })
    );
  } catch {
    // ignore quota / private-mode errors
  }
}

function clearMemberCache() {
  localStorage.removeItem(MEMBER_CACHE_KEY);
}

// =========================================================
// MEMBER TYPE
// =========================================================

type Member = {
  name: string;
  email: string;
  regNo: string;
  branch: string;
  year: string;
  wing: string;
  skills: string;
  portfolio: string;
  Attendance: string;
  status: string;
};

const DEFAULT_MEMBER: Member = {
  name: "Member",
  email: "",
  regNo: "",
  branch: "",
  year: "",
  wing: "",
  skills: "",
  portfolio: "",
  Attendance: "0",
  status: "active",
};

// =========================================================
// NOTIFICATIONS + POLLS TYPES  (backed by API now)
// =========================================================

type NotificationItem = {
  id: string;
  text: string;
  time: string;
};

type PollOption = {
  text: string;
  votes: number;
};

type PollItem = {
  id: string;
  q: string;
  options: PollOption[];
  myVote?: string | null;
};

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();

  if (Number.isNaN(then)) return "";

  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60000);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// =========================================================
// COMMUNITY LINKS (still static)
// =========================================================

const COMMUNITY_LINKS = [
  { label: "WhatsApp", icon: MessageCircle, href: "#", tone: "text-green-400 border-green-400/20 bg-green-400/10" },
  { label: "Discord", icon: Hash, href: "#", tone: "text-sky-400 border-sky-400/20 bg-sky-400/10" },
  { label: "Instagram", icon: Instagram, href: "#", tone: "text-pink-400 border-pink-400/20 bg-pink-400/10" },
  { label: "LinkedIn", icon: Linkedin, href: "#", tone: "text-blue-400 border-blue-400/20 bg-blue-400/10" },
];

const LEADERBOARD = [
  { id: 1, name: "Kabir Singh", wing: "Rocketry Wing", points: 1240 },
  { id: 2, name: "Aarav Sharma", wing: "CSE Wing", points: 1105 },
  { id: 3, name: "You", wing: "CSE Wing", points: 980, self: true },
  { id: 4, name: "Ishita Rao", wing: "Electronics Wing", points: 860 },
  { id: 5, name: "Meera Nair", wing: "Mechatronics Wing", points: 720 },
];

// =========================================================
// SMALL HELPERS
// =========================================================

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.02] p-6 ${className}`}>
      {children}
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-mono tracking-widest text-sky-400 mb-2">{children}</p>;
}

function qrCell(i: number) {
  const seed = (i * 2654435761) % 2 ** 32;
  return (seed >>> 24) % 5 === 0;
}

function initialsOf(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

// =========================================================
// VIRTUAL ID
// =========================================================

function VirtualIdCard({ member }: { member: Member }) {
  const cells = Array.from({ length: 64 });

  return (
    <Card className="relative overflow-hidden">
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{
          backgroundImage: "linear-gradient(90deg, #F97316, #FACC15, #22C55E, #38BDF8)",
        }}
      />
      <p className="text-[10px] font-mono tracking-widest text-white/40 mb-4">VIRTUAL ID · CREST</p>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold">{member.name}</h3>
          <p className="text-sm text-white/50 mt-0.5">
            {member.branch || "Branch"} · Reg {member.regNo || "N/A"}
          </p>

          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full border border-sky-400/20 bg-sky-400/10 text-sky-400">
              {member.wing || "CREST Member"}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full border border-yellow-400/20 bg-yellow-400/10 text-yellow-400">
              Core Member
            </span>
          </div>
        </div>

        <div className="shrink-0">
          <div className="w-16 h-16 rounded-lg bg-white p-1.5 grid grid-cols-8 grid-rows-8 gap-[1px]">
            {cells.map((_, i) => (
              <div key={i} className={qrCell(i) ? "bg-black" : "bg-white"} />
            ))}
          </div>
          <p className="text-[9px] text-white/30 text-center mt-1 flex items-center justify-center gap-1">
            <QrCode className="w-2.5 h-2.5" /> scan
          </p>
        </div>
      </div>

      <p className="text-[10px] text-white/25 font-mono tracking-widest mt-5">
        MEMBER SINCE {member.year || "2026"}
      </p>
    </Card>
  );
}

// =========================================================
// ATTENDANCE
// =========================================================

function AttendanceCard({ member }: { member: Member }) {
  const parsedAttendance = Number.parseInt(member.Attendance, 10);
  const pct = Number.isFinite(parsedAttendance)
    ? Math.min(100, Math.max(0, parsedAttendance))
    : 0;

  return (
    <Card className="flex flex-col items-center justify-center text-center">
      <p className="text-[10px] font-mono tracking-widest text-white/40 mb-4 self-start">ATTENDANCE</p>

      <div
        className="w-28 h-28 rounded-full flex items-center justify-center"
        style={{
          background: `conic-gradient(#38BDF8 ${pct * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
        }}
      >
        <div className="w-[88px] h-[88px] rounded-full bg-black flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{pct}%</span>
          <span className="text-[9px] text-white/40">this semester</span>
        </div>
      </div>
    </Card>
  );
}

// =========================================================
// NOTIFICATIONS (backend-wired)
// =========================================================

function NotificationsCard({
  notifications,
  loading,
}: {
  notifications: NotificationItem[];
  loading: boolean;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-mono tracking-widest text-white/40">NOTIFICATIONS</p>
        <Bell className="w-3.5 h-3.5 text-white/30" />
      </div>

      {loading ? (
        <p className="text-sm text-white/40">Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <p className="text-sm text-white/40">No notifications yet.</p>
      ) : (
        <ul className="space-y-3">
          {notifications.map((n) => (
            <li key={n.id} className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 bg-sky-400" />
              <div className="min-w-0">
                <p className="text-sm text-white/80 leading-snug">{n.text}</p>
                <p className="text-[11px] text-white/30 mt-0.5">{n.time}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// =========================================================
// ACCOUNT & SECURITY — password change entry point
// =========================================================

function AccountSecurityCard({
  member,
  onChangePassword,
}: {
  member: Member;
  onChangePassword: () => void;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-mono tracking-widest text-white/40 flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-green-400" /> ACCOUNT &amp; SECURITY
        </p>
        <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full border border-green-400/20 bg-green-400/10 text-green-400">
          {member.status || "active"}
        </span>
      </div>

      <p className="text-sm text-white/60 leading-snug">
        Signed in as{" "}
        <span className="text-white/85">{member.email || "your CREST account"}</span>.
      </p>
      <p className="text-[11px] text-white/35 mt-1">
        Use a strong password of at least 8 characters. You'll stay signed in after changing it.
      </p>

      <button
        onClick={onChangePassword}
        className="mt-5 inline-flex items-center gap-2 rounded-lg border border-sky-400/25 bg-sky-400/10 px-3.5 py-2 text-xs font-medium text-sky-400 transition-transform hover:-translate-y-0.5"
      >
        <KeyRound className="w-3.5 h-3.5" />
        Change password
      </button>
    </Card>
  );
}

// =========================================================
// CHANGE PASSWORD MODAL
// =========================================================

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <label className="block">
      <span className="text-[10px] font-mono tracking-widest text-white/40">{label}</span>
      <div className="relative mt-1.5">
        <input
          type={show ? "text" : "password"}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 pr-10 text-sm text-white outline-none focus:border-sky-400/40"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/70"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </label>
  );
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("New password must be different from the current one.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    const token = getStoredToken();
    if (!token) {
      setError("Your session expired. Please sign in again.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/member/change-password`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.success === false) {
        throw new Error(data.detail || data.message || "Unable to change password.");
      }

      // Backend may issue a fresh token after a password change.
      if (data.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
      }

      setSuccess("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(onClose, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to change password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={saving ? undefined : onClose}
      />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a0a] p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-[10px] font-mono tracking-widest text-sky-400">/ SECURITY</p>
            <h3 className="text-lg font-bold mt-1">Change password</h3>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-white/40 hover:text-white disabled:opacity-40"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <PasswordField
            label="CURRENT PASSWORD"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
          />
          <PasswordField
            label="NEW PASSWORD"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
          />
          <PasswordField
            label="CONFIRM NEW PASSWORD"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
          />

          {error && (
            <p className="text-[12px] text-red-400 border border-red-400/20 bg-red-400/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-[12px] text-green-400 border border-green-400/20 bg-green-400/10 rounded-lg px-3 py-2">
              {success}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-white/10 px-3.5 py-2 text-xs text-white/60 hover:text-white disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg border border-sky-400/25 bg-sky-400/10 px-3.5 py-2 text-xs font-medium text-sky-400 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
              {saving ? "Updating..." : "Update password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =========================================================
// RANK
// =========================================================

function LeaderboardCard() {
  const me = LEADERBOARD.find((m) => m.self);
  const myRank = LEADERBOARD.findIndex((m) => m.self) + 1;
  const top = LEADERBOARD[0].points;
  const medal = ["text-yellow-400", "text-white/60", "text-orange-400"];

  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-center justify-between mb-5">
        <p className="text-[10px] font-mono tracking-widest text-white/40 flex items-center gap-2">
          <Trophy className="w-3.5 h-3.5 text-yellow-400" /> LEADERBOARD
        </p>
        {me && (
          <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full border border-sky-400/20 bg-sky-400/10 text-sky-400">
            You · #{myRank} · {me.points} pts
          </span>
        )}
      </div>

      <ul className="space-y-3">
        {LEADERBOARD.map((m, i) => (
          <li key={m.id}>
            <div className="flex items-center gap-3">
              <span
                className={`w-5 text-xs font-mono ${i < 3 ? medal[i] : "text-white/30"} flex items-center`}
              >
                {i === 0 ? <Crown className="w-3.5 h-3.5" /> : i + 1}
              </span>
              <span
                className={`w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-mono shrink-0 ${
                  m.self
                    ? "bg-sky-400/15 border-sky-400/40 text-sky-400"
                    : "bg-white/5 border-white/10 text-white/50"
                }`}
              >
                {initialsOf(m.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className={`text-sm font-medium truncate ${m.self ? "text-sky-400" : ""}`}>
                    {m.name}
                  </p>
                  <span className="text-sm font-mono text-white/60">{m.points}</span>
                </div>
                <div className="h-1 rounded-full bg-white/10 mt-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${m.self ? "bg-sky-400" : "bg-white/25"}`}
                    style={{ width: `${(m.points / top) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-white/30 mt-1">{m.wing}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// =========================================================
// POLLS (backend-wired)
// =========================================================

function PollsCard({
  polls,
  loading,
  onVote,
}: {
  polls: PollItem[];
  loading: boolean;
  onVote: (pollId: string, option: string) => void;
}) {
  return (
    <Card>
      <p className="text-[10px] font-mono tracking-widest text-white/40 mb-5 flex items-center gap-2">
        <Vote className="w-3.5 h-3.5 text-sky-400" />
        POLLS &amp; FEEDBACK
      </p>

      {loading ? (
        <p className="text-sm text-white/40">
          Loading polls...
        </p>
      ) : polls.length === 0 ? (
        <p className="text-sm text-white/40">
          No active polls right now.
        </p>
      ) : (
        <div className="space-y-7">
          {polls.map((p) => {
            const totalVotes = p.options.reduce(
              (sum, option) => sum + Number(option.votes || 0),
              0
            );

            const choice = p.myVote;

            return (
              <div
                key={p.id}
                className="border-b border-white/10 pb-6 last:border-b-0 last:pb-0"
              >
                {/* Question */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-white">
                    {p.q}
                  </p>

                  <p className="text-[11px] text-white/30 mt-1">
                    {totalVotes}{" "}
                    {totalVotes === 1 ? "vote" : "votes"} total
                  </p>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  {p.options.map((o) => {
                    const votes = Number(o.votes || 0);

                    const percentage =
                      totalVotes > 0
                        ? Math.round((votes / totalVotes) * 100)
                        : 0;

                    const selected = choice === o.text;

                    return (
                      <button
                        key={o.text}
                        type="button"
                        disabled={!!choice}
                        onClick={() => {
                          if (!choice) {
                            onVote(p.id, o.text);
                          }
                        }}
                        className={`w-full text-left rounded-xl border p-3 transition-all ${
                          selected
                            ? "border-sky-400/40 bg-sky-400/10"
                            : choice
                            ? "border-white/10 bg-white/[0.02]"
                            : "border-white/10 bg-white/[0.02] hover:border-sky-400/30 hover:bg-sky-400/[0.04]"
                        }`}
                      >
                        {/* Option name + vote count */}
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <span
                            className={`text-xs font-medium ${
                              selected
                                ? "text-sky-400"
                                : "text-white/70"
                            }`}
                          >
                            {o.text}
                          </span>

                          <span className="text-[11px] font-mono text-white/40">
                            {votes}{" "}
                            {votes === 1 ? "vote" : "votes"}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              selected
                                ? "bg-sky-400"
                                : "bg-white/25"
                            }`}
                            style={{
                              width: `${choice ? percentage : 0}%`,
                            }}
                          />
                        </div>

                        {/* Percentage */}
                        {choice && (
                          <div className="flex justify-between mt-1.5">
                            <span className="text-[10px] text-white/30">
                              {percentage}%
                            </span>

                            {selected && (
                              <span className="text-[10px] text-sky-400">
                                Your vote
                              </span>
                            )}
                          </div>
                        )}

                        {/* Before voting */}
                        {!choice && (
                          <p className="text-[10px] text-white/30 mt-2">
                            Click to vote
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Vote status */}
                {choice && (
                  <div className="mt-3 rounded-lg border border-green-400/20 bg-green-400/10 px-3 py-2">
                    <p className="text-[11px] text-green-400">
                      ✓ Vote recorded
                    </p>

                    <p className="text-[10px] text-white/40 mt-0.5">
                      You selected:{" "}
                      <span className="text-white/70">
                        {choice}
                      </span>
                    </p>

                    <p className="text-[10px] text-white/30 mt-0.5">
                      You can vote only once in this poll.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// =========================================================
// COMMUNITY LINKS
// =========================================================

function CommunityLinksRow() {
  return (
    <Card>
      <p className="text-[10px] font-mono tracking-widest text-white/40 mb-4">COMMUNITY</p>
      <div className="flex flex-wrap gap-3">
        {COMMUNITY_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <a
              key={link.label}
              href={link.href}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-medium transition-transform hover:-translate-y-0.5 ${link.tone}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {link.label}
            </a>
          );
        })}
      </div>
    </Card>
  );
}

// =========================================================
// EXPLORE
// =========================================================

function ExploreCard({
  title,
  desc,
  to,
  icon: Icon,
}: {
  title: string;
  desc: string;
  to: string;
  icon: typeof Sparkles;
}) {
  return (
    <a
      href={to}
      className="group flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-6 hover:border-sky-400/30 transition-colors"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-sky-400/10 border border-sky-400/20 flex items-center justify-center shrink-0">
          <Icon className="w-4.5 h-4.5 text-sky-400" />
        </div>
        <div>
          <h4 className="font-semibold">{title}</h4>
          <p className="text-sm text-white/50 mt-1">{desc}</p>
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-sky-400 group-hover:translate-x-1 transition-all shrink-0" />
    </a>
  );
}

// =========================================================
// WORKSHOPS & EVENTS SECTION (WITH ENROLLED TAB)
// =========================================================

type WorkshopTab = "ongoing" | "upcoming" | "past" | "enrolled";

type MockWorkshopItem = {
  id: string;
  title: string;
  wing: string;
  wingTone: "sky" | "green" | "yellow" | "red";
  completedSessions?: number;
  totalSessions?: number;
  date?: string;
  desc?: string;
};

const DASHBOARD_WORKSHOPS: Record<WorkshopTab, MockWorkshopItem[]> = {
  ongoing: [
    {
      id: "py-auto",
      title: "Python Workshop: Autonomous Systems",
      wing: "Software Wing",
      wingTone: "sky",
      date: "Aug 20 – Oct 17, 2026",
      desc: "System controllers, sensor parsing, and multi-threading.",
    },
    {
      id: "c-embedded",
      title: "C Workshop: Microcontrollers & Firmware",
      wing: "Electronics Wing",
      wingTone: "green",
      date: "Aug 25 – Oct 22, 2026",
      desc: "Bare-metal C, register control, and UART/SPI communication.",
    },
  ],
  upcoming: [
    {
      id: "electronics-basics",
      title: "Electronics Basics & PCB Design",
      wing: "Electronics Wing",
      wingTone: "green",
      date: "Nov 02 – Nov 28, 2026",
      desc: "Circuit fundamentals and KiCAD layout workflow.",
    },
    {
      id: "cad-rocketry",
      title: "3D CAD Modeling & Rocketry Dynamics",
      wing: "Rocketry Wing",
      wingTone: "red",
      date: "Nov 10 – Dec 12, 2026",
      desc: "SolidWorks nozzle design and aerodynamic trajectory.",
    },
  ],
  past: [
    {
      id: "past-ros",
      title: "ROS1 Fundamentals & Kinematics",
      wing: "Mechatronics Wing",
      wingTone: "yellow",
      date: "May 10 – Jun 15, 2026",
      desc: "Completed spring cohort on mobile robot kinematics.",
    },
  ],
  enrolled: [
    {
      id: "enrolled-py",
      title: "Python Workshop: Autonomous & Embedded Systems",
      wing: "Software Wing",
      wingTone: "sky",
      completedSessions: 3,
      totalSessions: 6,
    },
    {
      id: "enrolled-c",
      title: "C Workshop: Microcontrollers & Firmware Design",
      wing: "Electronics Wing",
      wingTone: "green",
      completedSessions: 4,
      totalSessions: 6,
    },
    {
      id: "enrolled-cad",
      title: "3D CAD Modeling & Rocketry Dynamics",
      wing: "Rocketry Wing",
      wingTone: "red",
      completedSessions: 2,
      totalSessions: 6,
    },
  ],
};

function WorkshopsEventsCard() {
  const [activeTab, setActiveTab] = useState<WorkshopTab>("enrolled");

  const items = DASHBOARD_WORKSHOPS[activeTab];

  return (
    <Card className="mb-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <p className="text-[10px] font-mono tracking-widest text-white/40 flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-sky-400" /> WORKSHOPS &amp; EVENTS
        </p>

        {/* 4 Tabs: Ongoing, Upcoming, Past, Enrolled */}
        <div className="flex items-center gap-1 bg-white/[0.03] border border-white/10 p-1 rounded-lg flex-wrap">
          {(["ongoing", "upcoming", "past", "enrolled"] as WorkshopTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded text-xs font-mono capitalize transition-all ${
                activeTab === tab
                  ? "bg-sky-400 text-black font-semibold shadow-sm"
                  : "text-white/40 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {activeTab === "enrolled" ? (
          items.map((item) => {
            const completed = item.completedSessions ?? 0;
            const total = item.totalSessions ?? 6;
            const pct = Math.round((completed / total) * 100);

            return (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:border-sky-400/30 transition-all"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border border-sky-400/20 bg-sky-400/10 text-sky-400">
                      {item.wing}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-white truncate">{item.title}</h4>

                  {/* Progress Indicator */}
                  <div className="mt-3 max-w-xs">
                    <div className="flex justify-between items-center text-[11px] font-mono text-white/50 mb-1">
                      <span>{completed} of {total} sessions completed</span>
                      <span className="text-sky-400 font-semibold">{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-400 to-green-400 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <a
                  href="/workshops/detail"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-xs font-semibold text-sky-400 hover:bg-sky-400 hover:text-black transition-all shrink-0 self-start sm:self-center"
                >
                  Continue
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            );
          })
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:border-sky-400/30 transition-all"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border border-sky-400/20 bg-sky-400/10 text-sky-400">
                    {item.wing}
                  </span>
                  {item.date && (
                    <span className="text-[11px] font-mono text-white/40">· {item.date}</span>
                  )}
                </div>
                <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                {item.desc && <p className="text-xs text-white/45 mt-1">{item.desc}</p>}
              </div>

              <a
                href="/workshops/detail"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/70 hover:text-sky-400 hover:border-sky-400/30 transition-all shrink-0"
              >
                View Details
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

// =========================================================
// DASHBOARD
// =========================================================
function DashboardOverview() {
  const navigate = useNavigate();

  const cached = readMemberCache();
  const isCacheFresh = cached ? Date.now() - cached.cachedAt < CACHE_TTL_MS : false;

  const [member, setMember] = useState<Member>(cached?.member ?? DEFAULT_MEMBER);
  const [checkingAuth, setCheckingAuth] = useState(!isCacheFresh);
  const [authError, setAuthError] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // ---- notifications + polls (backend-wired) ----
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  const [polls, setPolls] = useState<PollItem[]>([]);
  const [pollsLoading, setPollsLoading] = useState(true);

  async function loadNotifications(token: string) {
    try {
      setNotificationsLoading(true);

      const response = await fetch(`${API_URL}/member/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to load notifications");
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.notifications)) {
        setNotifications(
          data.notifications.map(
            (n: { id: string; msg: string; sentAt: string }) => ({
              id: n.id,
              text: n.msg,
              time: timeAgo(n.sentAt),
            })
          )
        );
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setNotificationsLoading(false);
    }
  }

  async function loadPolls(token: string) {
    try {
      setPollsLoading(true);

      const response = await fetch(`${API_URL}/polls`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to load polls");
      }

      const data = await response.json();

      setPolls(
        (data as Array<{
          id: string;
          question: string;
          options: PollOption[];
          active: boolean;
          myVote?: string | null;
        }>)
          .filter((p) => p.active)
          .map((p) => ({
            id: p.id,
            q: p.question,
            options: p.options,
            myVote: p.myVote ?? null,
          }))
      );
    } catch (error) {
      console.error("Failed to load polls:", error);
    } finally {
      setPollsLoading(false);
    }
  }

  async function votePoll(pollId: string, option: string) {
  const token = getStoredToken();

  if (!token) {
    console.error("No access token found.");
    return;
  }

  // Extra frontend protection.
  // Backend MUST also enforce this.
  const currentPoll = polls.find((p) => p.id === pollId);

  if (!currentPoll) {
    return;
  }

  if (currentPoll.myVote) {
    console.warn("You have already voted in this poll.");
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/polls/${pollId}/vote`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          option,
        }),
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.detail || "Unable to record vote."
      );
    }

    if (!data.success) {
      throw new Error(
        data.message || "Unable to record vote."
      );
    }

    const updated = data.poll;

    if (!updated) {
      throw new Error("Invalid poll response from server.");
    }

    setPolls((previousPolls) =>
      previousPolls.map((poll) => {
        if (poll.id !== pollId) {
          return poll;
        }

        return {
          id: updated.id,
          q: updated.question,
          options: updated.options,
          myVote: updated.myVote ?? option,
        };
      })
    );
  } catch (error) {
    console.error("Failed to vote:", error);

    alert(
      error instanceof Error
        ? error.message
        : "Unable to record vote."
    );
  }
}

  useEffect(() => {
    let cancelled = false;

    async function verifyMember() {
      const token = getStoredToken();

      if (!token) {
        if (!cancelled) {
          clearMemberCache();
          setCheckingAuth(false);
          navigate({ to: "/login", replace: true });
        }
        return;
      }

      // We already have fresh cached data — render it immediately and
      // just revalidate quietly in the background below.
      if (isCacheFresh && cached) {
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

        const memberResponse = await fetch(`${API_URL}/member/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!memberResponse.ok) {
          throw new Error("Unable to load member data");
        }

        const memberData = await memberResponse.json();

        if (!memberData.success || !memberData.member) {
          throw new Error("Member data not found");
        }

        const data = memberData.member;

        if (!cancelled) {
          const nextMember: Member = {
            name: data.name || "Member",
            email: data.email || "",
            regNo: data.regNo || "",
            branch: data.branch || "",
            year: data.year || "",
            wing: data.wing || "",
            skills: data.skills || "",
            portfolio: data.portfolio || "",
            Attendance: String(data.Attendance ?? "0"),
            status: data.status || "active",
          };

          setMember(nextMember);
          writeMemberCache(nextMember);

          localStorage.setItem("userName", nextMember.name);
          localStorage.setItem("userEmail", nextMember.email);
          localStorage.setItem("userWing", nextMember.wing);
          localStorage.setItem("userRole", "member");

          setAuthError("");
          setCheckingAuth(false);

          // Auth confirmed — pull real notifications + polls.
          loadNotifications(token);
          loadPolls(token);
        }
      } catch (error) {
        console.error("Member authentication failed:", error);

        if (!cancelled) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("userName");
          localStorage.removeItem("userEmail");
          localStorage.removeItem("userWing");
          localStorage.removeItem("userRole");
          clearMemberCache();

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

  // If we rendered instantly from a fresh cache, still fetch
  // notifications/polls once (the effect above only fires them
  // from inside the full verify path).

  useEffect(() => {
    if (checkingAuth || authError) return;

    const token = getStoredToken();
    if (!token) return;

    loadNotifications(token);
    loadPolls(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkingAuth, authError]);

  // =======================================================
  // LOADING
  // =======================================================

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

  // =======================================================
  // AUTH ERROR
  // =======================================================

  if (authError) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <p className="text-sm text-red-400">{authError}</p>
      </div>
    );
  }

  // =======================================================
  // DASHBOARD
  // =======================================================

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

        <DashboardNav active="overview" />

        <main className="relative z-10 max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-10">
            <div>
              <Eyebrow>/ DASHBOARD</Eyebrow>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                Welcome back, {member.name.split(" ")[0]}
              </h1>
              <p className="text-white/50">Here's where things stand across CREST right now.</p>
            </div>

            <button
              onClick={() => setShowPasswordModal(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-white/70 transition-colors hover:border-sky-400/30 hover:text-sky-400"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Change password
            </button>
          </div>

          {/* Top row: ID card + Attendance */}
          <div className="grid md:grid-cols-3 gap-5 mb-5">
            <div className="md:col-span-2">
              <VirtualIdCard member={member} />
            </div>
            <AttendanceCard member={member} />
          </div>

          {/* Workshops & Events Section */}
          <WorkshopsEventsCard />

          {/* Rank + polls */}
          <div className="grid md:grid-cols-2 gap-5 mb-5">
            <LeaderboardCard />
            <PollsCard polls={polls} loading={pollsLoading} onVote={votePoll} />
          </div>

          {/* Notifications + community */}
          <div className="grid md:grid-cols-2 gap-5 mb-5">
            <NotificationsCard notifications={notifications} loading={notificationsLoading} />
            <CommunityLinksRow />
          </div>

          {/* Account & security */}
          <div className="grid md:grid-cols-2 gap-5 mb-5">
            <AccountSecurityCard
              member={member}
              onChangePassword={() => setShowPasswordModal(true)}
            />
          </div>

          {/* Explore other sections */}
          <div className="grid md:grid-cols-2 gap-5 mt-10">
            <ExploreCard
              title="Growth"
              desc="Events, team building, projects, assignments & achievements."
              to="/dashboard/growth"
              icon={Sparkles}
            />
            <ExploreCard
              title="Community"
              desc="Pitch to founders, mentors, lab bookings & job board."
              to="/dashboard/community"
              icon={Users2}
            />
          </div>
        </main>

        {showPasswordModal && (
          <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
        )}
      </div>
    </SiteShell>
  );
}