import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Users,
  TrendingUp,
  IndianRupee,
  Filter,
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldAlert,
  BarChart3,
  Megaphone,
  CalendarDays,
  GraduationCap,
  Route as RouteIcon,
  FolderKanban,
  MessageSquare,
  Server,
  Briefcase,
  Shuffle,
  Plus,
  Trash2,
  Download,
  Send,
  Bell,
  UserPlus,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";

import {
  WINGS,
  REVENUE,
  PROFIT,
  ACHIEVEMENTS,
  type Application,
} from "@/lib/crest-data";

// =========================================================
// ROUTE
// =========================================================

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      {
        title: "Admin Dashboard · CREST",
      },
      {
        name: "description",
        content:
          "CREST admin — recruitment onboarding, revenue analytics, and organizational metrics.",
      },
      {
        name: "robots",
        content: "noindex",
      },
    ],
  }),

  component: Admin,
});

// =========================================================
// API
// =========================================================

const API_URL = "https://crest-vif2.onrender.com";

// =========================================================
// AUTHENTICATED FETCH
// =========================================================

async function authFetch(
  url: string,
  options: RequestInit = {}
) {
  const token = localStorage.getItem("accessToken");

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
  }

  return response;
}

// =========================================================
// CHART COLORS
// =========================================================

const CHART_COLORS = [
  "var(--brand-blue)",
  "var(--brand-green)",
  "var(--brand-yellow)",
  "var(--brand-red)",
  "#a78bfa",
  "#f472b6",
  "#22d3ee",
];

// =========================================================
// HELPERS
// =========================================================

function fmtINR(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

// =========================================================
// ADMIN
// =========================================================


// =========================================================
// ADMIN MODULE TYPES  (added — nothing existing was changed)
// =========================================================

type Poll = {
  id: string;
  question: string;
  options: { text: string; votes: number }[];
  active: boolean;
  createdAt: string;
};

type Notice = {
  id: string;
  message: string;
  audience: string;
  sentAt: string;
};

type Registration = {
  id: string;
  team: string;
  leader: string;
  email: string;
  members: string;
  memberEmails: string[];
  memberList: { email: string; name: string; wing: string }[];
  submitted: string;
  status: string;
};

type EventItem = {
  id: string;
  kind: "workshop" | "event";
  category: "workshop" | "technical" | "non-technical";
  title: string;
  instructions: string;
  minTeam: number;
  maxTeam: number;
  lastDate: string;
  status: string;
  registrations: Registration[];
  question?: {
    title: string;
    prompt: string;
    starter: string;
    expectedOutput: string;
  } | null;
  winnerEmail?: string | null;
  winnerName?: string | null;
  winnerStatus?: string | null;
};

type LearningItem = {
  id: string;
  type: "course" | "roadmap";
  title: string;
  skill: string;
  track: string;
  detail: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  mentor: string;
  link: string;
  stepsText: string;
};

type AssignmentItem = {
  id: string;
  title: string;
  description: string;
  wing: string;
  link: string;
  dueDate: string;
};

type ProjectMember = {
  name: string;
  role: string;
  assignment: string;
  state: "invited" | "active";
};

type ProjectItem = {
  id: string;
  title: string;
  domain: string;
  status: "planning" | "running" | "completed";
  members: ProjectMember[];
};

type Pitch = {
  id: string;
  member: string;
  title: string;
  summary: string;
  status: "new" | "accepted" | "declined";
};

type ResourceItem = {
  id: string;
  name: string;
  category: string;
  usedBy: string;
  status: "available" | "in-use" | "maintenance";
};

type Opening = {
  id: string;
  company: string;
  role: string;
  kind: "internship" | "job";
  stipend: string;
  deadline: string;
  active: boolean;
};

type CrossRequest = {
  id: string;
  member: string;
  fromWing: string;
  toWing: string;
  reason: string;
  status: "pending" | "accepted" | "declined";
};

type AdminSection =
  | "overview"
  | "polls"
  | "events"
  | "learning"
  | "projects"
  | "pitches"
  | "resources"
  | "board"
  | "crossdomain";

// =========================================================
// SEED DATA (replace with backend data when endpoints exist)
// =========================================================

const SEED_PROJECTS: ProjectItem[] = [
  {
    id: "pr1",
    title: "CREST Member Portal",
    domain: "Web",
    status: "running",
    members: [
      {
        name: "Kabir Jain",
        role: "Frontend Dev",
        assignment: "Dashboard polling widget",
        state: "active",
      },
      {
        name: "Nisha Patel",
        role: "Backend Dev",
        assignment: "Team invite APIs",
        state: "invited",
      },
    ],
  },
];

const SEED_PITCHES: Pitch[] = [
  {
    id: "pi1",
    member: "Ishaan Verma",
    title: "Campus drone delivery pilot",
    summary:
      "Low-cost quad + locker network for intra-campus deliveries. Needs seed funding and a faculty mentor.",
    status: "new",
  },
];

const SEED_RESOURCES: ResourceItem[] = [
  {
    id: "rs1",
    name: "3D Printer · Ender 3",
    category: "Fabrication",
    usedBy: "Team VoltEdge",
    status: "in-use",
  },
  {
    id: "rs2",
    name: "Oscilloscope · DSO 100MHz",
    category: "Lab",
    usedBy: "—",
    status: "available",
  },
];

const SEED_OPENINGS: Opening[] = [
  {
    id: "o1",
    company: "Nexbyte Labs",
    role: "Frontend Intern",
    kind: "internship",
    stipend: "₹15,000/mo",
    deadline: "2026-09-01",
    active: true,
  },
];

const SEED_CROSS: CrossRequest[] = [
  {
    id: "cd1",
    member: "Dev Mehta",
    fromWing: "Hardware",
    toWing: "Software",
    reason: "Wants to contribute to the portal backend.",
    status: "pending",
  },
];

// =========================================================
// CSV / EXCEL EXPORT
// =========================================================

function downloadSheet(filename: string, rows: Record<string, string>[]) {
  if (rows.length === 0) {
    alert("Nothing to export yet.");
    return;
  }

  const headers = Object.keys(rows[0]!);

  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      headers
        .map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function Admin() {
  const navigate = useNavigate();

  // =======================================================
  // AUTHENTICATION
  // =======================================================

  const [checkingAdmin, setCheckingAdmin] = useState(true);

  const [isAdmin, setIsAdmin] = useState(false);

  // Authentication failure screen
  const [authFailed, setAuthFailed] = useState(false);

  // =======================================================
  // APPLICATION STATES
  // =======================================================

  const [apps, setApps] = useState<Application[]>([]);

  const [shortlistedApps, setShortlistedApps] =
    useState<Application[]>([]);

  const [rejectedApps, setRejectedApps] =
    useState<Application[]>([]);

  // =======================================================
  // UI STATES
  // =======================================================

  const [filter, setFilter] =
    useState<"all" | Application["status"]>("all");

  const [wingFilter, setWingFilter] =
    useState<string>("all");

  const [activeTab, setActiveTab] =
    useState<"new" | "shortlisted" | "rejected">("new");

  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] =
    useState<string | null>(null);

  // =======================================================
  // AUTHENTICATION FAILURE
  // =======================================================

  function handleAuthFailure() {
    // Prevent this function from running multiple times
    if (authFailed) {
      return;
    }

    setIsAdmin(false);
    setAuthFailed(true);

    // Remove invalid credentials
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");

    // Wait, then send them to login.
    // (window.history.back() was unreliable here —
    // if /admin was opened directly with no prior
    // history entry, it did nothing and the user was
    // stuck on the "Authentication Failed" screen.)
    setTimeout(() => {
      navigate({ to: "/login" });
    }, 2000);
  }

  // =======================================================
  // CHECK ADMIN
  // =======================================================

  async function checkAdmin() {
    try {
      setCheckingAdmin(true);

      const token = localStorage.getItem("accessToken");
      const role = localStorage.getItem("userRole");

      if (!token || role !== "admin") {
        handleAuthFailure();
        return;
      }

      const response = await authFetch(
        `${API_URL}/admin/verify`,
        { method: "POST" }
      );

      if (!response.ok) {
        handleAuthFailure();
        return;
      }

      const data = await response.json();

      if (data.success === true && data.role === "admin") {
        setIsAdmin(true);
        return;
      }

      handleAuthFailure();
    } catch (error) {
      console.error("Admin authentication error:", error);
      handleAuthFailure();
    } finally {
      setCheckingAdmin(false);
    }
  }

  // =======================================================
  // CHECK ADMIN WHEN PAGE OPENS
  // =======================================================

  useEffect(() => {
    checkAdmin();
  }, []);

  // =======================================================
  // LOAD ALL APPLICATIONS
  // =======================================================

  async function loadAllApplications() {
    try {
      setLoading(true);

      const [
        newResponse,
        shortlistedResponse,
        rejectedResponse,
      ] = await Promise.all([
        authFetch(`${API_URL}/loadata`),

        authFetch(`${API_URL}/loadshortlisted`),

        authFetch(`${API_URL}/loadrejected`),
      ]);

      if (!newResponse.ok) {
        throw new Error(
          "Failed to load new applications"
        );
      }

      if (!shortlistedResponse.ok) {
        throw new Error(
          "Failed to load shortlisted applications"
        );
      }

      if (!rejectedResponse.ok) {
        throw new Error(
          "Failed to load rejected applications"
        );
      }

      const newData =
        await newResponse.json();

      const shortlistedData =
        await shortlistedResponse.json();

      const rejectedData =
        await rejectedResponse.json();

      setApps(newData);

      setShortlistedApps(
        shortlistedData
      );

      setRejectedApps(
        rejectedData
      );

    } catch (error) {
      console.error(
        "Failed to load applications:",
        error
      );

    } finally {
      setLoading(false);
    }
  }

  // =======================================================
  // LOAD DATA AFTER ADMIN AUTHENTICATION
  // =======================================================

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    loadAllApplications();
  }, [isAdmin]);

  // =======================================================
  // CURRENT APPLICATION LIST
  // =======================================================

  const currentApps = useMemo(() => {
    let data: Application[] = [];

    if (activeTab === "new") {
      data = apps;
    }

    if (activeTab === "shortlisted") {
      data = shortlistedApps;
    }

    if (activeTab === "rejected") {
      data = rejectedApps;
    }

    return data.filter(
      (a) =>
        (
          filter === "all" ||
          a.status === filter
        ) &&
        (
          wingFilter === "all" ||
          a.wing === wingFilter
        )
    );
  }, [
    apps,
    shortlistedApps,
    rejectedApps,
    activeTab,
    filter,
    wingFilter,
  ]);

  // =======================================================
  // WING COUNTS
  // =======================================================

  const wingCounts = useMemo(() => {
    return WINGS.map((w) => ({
      name: w.name
        .replace(" Wing", "")
        .replace("CREST ", ""),

      value: apps.filter(
        (a) => a.wing === w.key
      ).length,
    }));
  }, [apps]);

  // =======================================================
  // STATUS COUNTS
  // =======================================================

  const statusCounts = useMemo(() => {
    return [
      {
        name: "New",
        value: apps.length,
      },

      {
        name: "Shortlisted",
        value: shortlistedApps.length,
      },

      {
        name: "Rejected",
        value: rejectedApps.length,
      },
    ];
  }, [
    apps,
    shortlistedApps,
    rejectedApps,
  ]);

  // =======================================================
  // APPLICATION TIMELINE
  // =======================================================

  const timeline = useMemo(() => {
    const days: {
      date: string;
      count: number;
    }[] = [];

    for (let i = 13; i >= 0; i--) {
      const d = new Date();

      d.setDate(
        d.getDate() - i
      );

      const key =
        d.toISOString().slice(
          0,
          10
        );

      days.push({
        date:
          d.toLocaleDateString(
            "en-IN",
            {
              day: "2-digit",
              month: "short",
            }
          ),

        count:
          apps.filter(
            (a) =>
              a.createdAt &&
              a.createdAt.slice(
                0,
                10
              ) === key
          ).length,
      });
    }

    return days;
  }, [apps]);

  // =======================================================
  // RADAR
  // =======================================================

  const wingRadar = WINGS.map(
    (w) => ({
      wing:
        w.name.split(" ")[0],

      strength:
        60 +
        (
          (w.key.charCodeAt(0) * 7)
          % 40
        ),
    })
  );

  // =======================================================
  // ACHIEVEMENTS
  // =======================================================

  const achievementsByLevel =
    useMemo(() => {
      const map = new Map<string, number>();

      ACHIEVEMENTS.forEach(
        (a) => {
          map.set(
            a.level,
            (
              map.get(a.level)
              ?? 0
            ) + 1
          );
        }
      );

      return Array.from(
        map.entries()
      ).map(
        ([name, value]) => ({
          name,
          value,
        })
      );
    }, []);

  // =======================================================
  // SHORTLIST / REJECT
  // =======================================================

  async function setStatus(
    id: string,
    status:
      | "shortlisted"
      | "rejected"
  ) {
    try {
      setActionLoading(id);

      const endpoint =
        status === "shortlisted"
          ? `${API_URL}/shortlist/${id}`
          : `${API_URL}/reject/${id}`;

      const response =
        await authFetch(
          endpoint,
          {
            method: "POST",
          }
        );

      if (!response.ok) {
        const error =
          await response.text();

        throw new Error(error);
      }

      await loadAllApplications();

    } catch (error) {
      console.error(
        `Failed to ${status} application:`,
        error
      );

      alert(
        `Failed to ${status} application`
      );

    } finally {
      setActionLoading(null);
    }
  }

  // =======================================================
  // RESET FILTERS
  // =======================================================

  function resetFilters() {
    setFilter("all");
    setWingFilter("all");
  }


  // =======================================================
  // ADMIN SECTION NAVIGATION  (added)
  // =======================================================

  const [section, setSection] = useState<AdminSection>("overview");

  // =======================================================
  // POLLS + NOTIFICATIONS  (added, backed by API)
  // =======================================================

  const [polls, setPolls] = useState<Poll[]>([]);
  const [pollsLoading, setPollsLoading] = useState(true);

  const [pollQuestion, setPollQuestion] = useState("");

  const [pollOptions, setPollOptions] = useState("");

  const [notices, setNotices] = useState<Notice[]>([]);
  const [noticesLoading, setNoticesLoading] = useState(true);

  const [noticeText, setNoticeText] = useState("");

  const [noticeAudience, setNoticeAudience] = useState("All members");

  async function loadPolls() {
    try {
      setPollsLoading(true);

      const response = await authFetch(`${API_URL}/polls`);

      if (!response.ok) {
        throw new Error("Failed to load polls");
      }

      const data = await response.json();

      setPolls(data);
    } catch (error) {
      console.error("Failed to load polls:", error);
    } finally {
      setPollsLoading(false);
    }
  }

  async function loadNotices() {
    try {
      setNoticesLoading(true);

      const response = await authFetch(`${API_URL}/admin/notify`);

      if (!response.ok) {
        throw new Error("Failed to load notifications");
      }

      const data = await response.json();

      setNotices(
        data.map(
          (n: {
            id: string;
            msg: string;
            audience: string;
            sentAt: string;
          }) => ({
            id: n.id,
            message: n.msg,
            audience: n.audience,
            sentAt: n.sentAt,
          })
        )
      );
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setNoticesLoading(false);
    }
  }

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    loadPolls();
    loadNotices();
  }, [isAdmin]);

  async function addPoll() {
    const opts = pollOptions
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);

    if (!pollQuestion.trim() || opts.length < 2) {
      alert("Add a question and at least two comma-separated options.");
      return;
    }

    try {
      const response = await authFetch(`${API_URL}/admin/polls`, {
        method: "POST",
        body: JSON.stringify({
          question: pollQuestion.trim(),
          options: opts,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      setPollQuestion("");
      setPollOptions("");

      await loadPolls();
    } catch (error) {
      console.error("Failed to create poll:", error);
      alert("Failed to create poll.");
    }
  }

  async function togglePoll(id: string) {
    try {
      const response = await authFetch(
        `${API_URL}/admin/polls/${id}/toggle`,
        { method: "POST" }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      await loadPolls();
    } catch (error) {
      console.error("Failed to update poll:", error);
      alert("Failed to update poll.");
    }
  }

  async function removePoll(id: string) {
    try {
      const response = await authFetch(`${API_URL}/admin/polls/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      await loadPolls();
    } catch (error) {
      console.error("Failed to delete poll:", error);
      alert("Failed to delete poll.");
    }
  }

  async function sendNotice() {
    if (!noticeText.trim()) {
      alert("Write a message before sending.");
      return;
    }

    try {
      const response = await authFetch(`${API_URL}/admin/notify`, {
        method: "POST",
        body: JSON.stringify({
          msg: noticeText,
          audience: noticeAudience,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();

        console.error("Notification send failed:", errorText);

        alert("Failed to send notification.");

        return;
      }

      setNoticeText("");

      await loadNotices();
    } catch (error) {
      // =====================================================
      // NETWORK / SERVER UNREACHABLE
      // =====================================================

      console.error("Notification send error:", error);

      alert("Failed to send notification.");
    }
  }
    

  // =======================================================
  // =======================================================
// WORKSHOPS + EVENTS — BACKEND WIRED
// =======================================================

const [events, setEvents] = useState<EventItem[]>([]);
const [eventForm, setEventForm] = useState({
  kind: "workshop" as EventItem["kind"],
  category: "workshop",
  title: "",
  instructions: "",
  minTeam: "1",
  maxTeam: "4",
  lastDate: "",
  status: "Upcoming",
  questionTitle: "",
  questionPrompt: "",
  questionStarter: "",
  expectedOutput: "",
});

const [winnerForm, setWinnerForm] = useState({
  eventId: "",
  memberEmail: "",
  name: "",
  year: String(new Date().getFullYear()),
  status: "winner",
});

async function loadGrowthAdminData() {
  try {
    const [eventsResponse, learningResponse, assignmentsResponse] =
      await Promise.all([
        authFetch(`${API_URL}/admin/growth/events`),
        authFetch(`${API_URL}/admin/growth/learning`),
        authFetch(`${API_URL}/admin/growth/assignments`),
      ]);

    if (!eventsResponse.ok || !learningResponse.ok || !assignmentsResponse.ok) {
      throw new Error("Failed to load growth admin data");
    }

    setEvents(await eventsResponse.json());
    setLearning(await learningResponse.json());
    setAssignments(await assignmentsResponse.json());
  } catch (error) {
    console.error("Failed to load growth admin data:", error);
  }
}

useEffect(() => {
  if (isAdmin) {
    loadGrowthAdminData();
  }
}, [isAdmin]);

async function addEvent() {
  if (!eventForm.title.trim() || !eventForm.lastDate) {
    alert("Title and last submission date are required.");
    return;
  }

  const question =
    eventForm.kind === "workshop"
      ? {
          title: eventForm.questionTitle.trim(),
          prompt: eventForm.questionPrompt.trim(),
          starter: eventForm.questionStarter,
          expectedOutput: eventForm.expectedOutput,
        }
      : null;

  try {
    const response = await authFetch(`${API_URL}/admin/growth/events`, {
      method: "POST",
      body: JSON.stringify({
        kind: eventForm.kind,
        category: eventForm.category,
        title: eventForm.title.trim(),
        instructions: eventForm.instructions.trim(),
        minTeam: Number(eventForm.minTeam) || 1,
        maxTeam: Number(eventForm.maxTeam) || 1,
        lastDate: eventForm.lastDate,
        status: eventForm.status,
        question,
      }),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    setEventForm({
      kind: "workshop",
      category: "workshop",
      title: "",
      instructions: "",
      minTeam: "1",
      maxTeam: "4",
      lastDate: "",
      status: "Upcoming",
      questionTitle: "",
      questionPrompt: "",
      questionStarter: "",
      expectedOutput: "",
    });

    await loadGrowthAdminData();
  } catch (error) {
    console.error("Failed to add event:", error);
    alert("Failed to publish workshop/event.");
  }
}

async function removeEvent(id: string) {
  if (!confirm("Remove this workshop/event?")) return;

  try {
    const response = await authFetch(`${API_URL}/admin/growth/events/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error(await response.text());

    await loadGrowthAdminData();
  } catch (error) {
    console.error("Failed to remove event:", error);
    alert("Failed to remove event.");
  }
}

async function updateEventQuestion(event: EventItem) {
  if (event.kind !== "workshop") return;

  const current = event.question ?? {
    title: "",
    prompt: "",
    starter: "",
    expectedOutput: "",
  };

  const title = window.prompt("Workshop question title:", current.title);
  if (title === null) return;

  const prompt = window.prompt("Workshop question/prompt:", current.prompt);
  if (prompt === null) return;

  const starter = window.prompt("Starter code:", current.starter);
  if (starter === null) return;

  const expectedOutput = window.prompt(
    "Expected output:",
    current.expectedOutput
  );
  if (expectedOutput === null) return;

  try {
    const response = await authFetch(
      `${API_URL}/admin/growth/events/${event.id}`,
      {
        method: "PUT",
        body: JSON.stringify({
          question: {
            title,
            prompt,
            starter,
            expectedOutput,
          },
        }),
      }
    );

    if (!response.ok) throw new Error(await response.text());

    await loadGrowthAdminData();
  } catch (error) {
    console.error("Failed to update workshop question:", error);
    alert("Failed to update workshop question.");
  }
}

async function updateEventStatus(event: EventItem, status: string) {
  try {
    const response = await authFetch(
      `${API_URL}/admin/growth/events/${event.id}`,
      {
        method: "PUT",
        body: JSON.stringify({ status }),
      }
    );

    if (!response.ok) throw new Error(await response.text());

    await loadGrowthAdminData();
  } catch (error) {
    console.error("Failed to update event status:", error);
    alert("Failed to update event status.");
  }
}

async function chooseWinner(event: EventItem) {
  if (winnerForm.eventId !== event.id || !winnerForm.memberEmail) {
    alert("Select the winning member first.");
    return;
  }

  try {
    const response = await authFetch(
      `${API_URL}/admin/growth/events/${event.id}/winner`,
      {
        method: "POST",
        body: JSON.stringify({
          memberEmail: winnerForm.memberEmail,
          name: winnerForm.name.trim() || `${event.title} Winner`,
          year: winnerForm.year,
          status: winnerForm.status || "winner",
        }),
      }
    );

    if (!response.ok) throw new Error(await response.text());

    setWinnerForm({
      eventId: "",
      memberEmail: "",
      name: "",
      year: String(new Date().getFullYear()),
      status: "winner",
    });

    await loadGrowthAdminData();
  } catch (error) {
    console.error("Failed to choose winner:", error);
    alert("Failed to update the event winner.");
  }
}

// =======================================================
// COURSES + SKILL ROADMAP + ASSIGNMENTS — BACKEND WIRED
// =======================================================

const [learning, setLearning] = useState<LearningItem[]>([]);
const [learningForm, setLearningForm] = useState({
  type: "course" as LearningItem["type"],
  title: "",
  skill: "",
  track: "",
  detail: "",
  level: "Beginner" as LearningItem["level"],
  duration: "",
  mentor: "",
  link: "",
  stepsText: "",
});

const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
const [assignmentForm, setAssignmentForm] = useState({
  title: "",
  description: "",
  wing: "",
  link: "",
  dueDate: "",
});

async function addLearning() {
  if (!learningForm.title.trim()) {
    alert("Title is required.");
    return;
  }

  try {
    const response = await authFetch(`${API_URL}/admin/growth/learning`, {
      method: "POST",
      body: JSON.stringify({ ...learningForm, type: "course", steps: learningForm.stepsText.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => { const [title, link = ""] = line.split("|"); return { title: title.trim(), link: link.trim() }; }) }),
    });

    if (!response.ok) throw new Error(await response.text());

    setLearningForm({
      type: "course",
      title: "",
      skill: "",
      track: "",
      detail: "",
      level: "Beginner",
      duration: "",
      mentor: "",
      link: "",
      stepsText: "",
    });

    await loadGrowthAdminData();
  } catch (error) {
    console.error("Failed to add learning item:", error);
    alert("Failed to add course/roadmap item.");
  }
}

async function removeLearning(id: string) {
  try {
    const response = await authFetch(`${API_URL}/admin/growth/learning/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error(await response.text());

    await loadGrowthAdminData();
  } catch (error) {
    console.error("Failed to remove learning item:", error);
    alert("Failed to remove course/roadmap item.");
  }
}

async function addAssignment() {
  if (!assignmentForm.title.trim() || !assignmentForm.wing.trim()) {
    alert("Assignment title and target wing are required.");
    return;
  }

  try {
    const response = await authFetch(`${API_URL}/admin/growth/assignments`, {
      method: "POST",
      body: JSON.stringify(assignmentForm),
    });

    if (!response.ok) throw new Error(await response.text());

    setAssignmentForm({
      title: "",
      description: "",
      wing: "",
      link: "",
      dueDate: "",
    });

    await loadGrowthAdminData();
  } catch (error) {
    console.error("Failed to add assignment:", error);
    alert("Failed to create assignment.");
  }
}

async function removeAssignment(id: string) {
  try {
    const response = await authFetch(
      `${API_URL}/admin/growth/assignments/${id}`,
      { method: "DELETE" }
    );

    if (!response.ok) throw new Error(await response.text());

    await loadGrowthAdminData();
  } catch (error) {
    console.error("Failed to remove assignment:", error);
    alert("Failed to remove assignment.");
  }
}

// PROJECTS · TEAMS · ASSIGNMENTS  (added)
  // =======================================================

  const [projects, setProjects] = useState<ProjectItem[]>(SEED_PROJECTS);

  const [projectForm, setProjectForm] = useState({
    title: "",
    domain: "",
  });

  const [memberForm, setMemberForm] = useState({
    projectId: "",
    name: "",
    role: "",
    assignment: "",
  });

  function addProject() {
    if (!projectForm.title.trim()) return;

    setProjects((prev) => [
      {
        id: uid(),
        title: projectForm.title.trim(),
        domain: projectForm.domain.trim() || "General",
        status: "planning",
        members: [],
      },
      ...prev,
    ]);

    setProjectForm({ title: "", domain: "" });
  }

  function inviteMember() {
    if (!memberForm.projectId || !memberForm.name.trim()) {
      alert("Pick a project and enter a member name.");
      return;
    }

    setProjects((prev) =>
      prev.map((p) =>
        p.id === memberForm.projectId
          ? {
              ...p,
              members: [
                ...p.members,
                {
                  name: memberForm.name.trim(),
                  role: memberForm.role.trim() || "Member",
                  assignment: memberForm.assignment.trim() || "—",
                  state: "invited",
                },
              ],
            }
          : p
      )
    );

    setMemberForm({
      projectId: memberForm.projectId,
      name: "",
      role: "",
      assignment: "",
    });
  }

  function setProjectStatus(id: string, status: ProjectItem["status"]) {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p))
    );
  }

  function updateAssignment(
    projectId: string,
    memberName: string,
    assignment: string
  ) {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              members: p.members.map((m) =>
                m.name === memberName ? { ...m, assignment } : m
              ),
            }
          : p
      )
    );
  }

  function markMemberActive(projectId: string, memberName: string) {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              members: p.members.map((m) =>
                m.name === memberName ? { ...m, state: "active" } : m
              ),
            }
          : p
      )
    );
  }

  // =======================================================
  // PITCHES  (added)
  // =======================================================

  const [pitches, setPitches] = useState<Pitch[]>(SEED_PITCHES);

  function setPitchStatus(id: string, status: Pitch["status"]) {
    setPitches((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p))
    );
  }

  // =======================================================
  // RESOURCES  (added)
  // =======================================================

  const [resources, setResources] = useState<ResourceItem[]>(SEED_RESOURCES);

  function setResourceStatus(id: string, status: ResourceItem["status"]) {
    setResources((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
              usedBy: status === "in-use" ? r.usedBy : "—",
            }
          : r
      )
    );
  }

  // =======================================================
  // INTERNSHIP / JOB BOARD  (added)
  // =======================================================

  const [openings, setOpenings] = useState<Opening[]>(SEED_OPENINGS);

  const [openingForm, setOpeningForm] = useState({
    company: "",
    role: "",
    kind: "internship" as Opening["kind"],
    stipend: "",
    deadline: "",
  });

  function addOpening() {
    if (!openingForm.company.trim() || !openingForm.role.trim()) {
      alert("Company and role are required.");
      return;
    }

    setOpenings((prev) => [
      { id: uid(), ...openingForm, active: true },
      ...prev,
    ]);

    setOpeningForm({
      company: "",
      role: "",
      kind: "internship",
      stipend: "",
      deadline: "",
    });
  }

  function toggleOpening(id: string) {
    setOpenings((prev) =>
      prev.map((o) => (o.id === id ? { ...o, active: !o.active } : o))
    );
  }

  function removeOpening(id: string) {
    setOpenings((prev) => prev.filter((o) => o.id !== id));
  }

  // =======================================================
  // CROSS-DOMAIN REQUESTS  (added)
  // =======================================================

  const [crossRequests, setCrossRequests] =
    useState<CrossRequest[]>(SEED_CROSS);

  function setCrossStatus(id: string, status: CrossRequest["status"]) {
    setCrossRequests((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c))
    );
  }

  // =======================================================
  // SECTION LIST  (added)
  // =======================================================

  const SECTIONS: { key: AdminSection; label: string; icon: LucideIcon }[] = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "polls", label: "Polls & Notify", icon: Megaphone },
    { key: "events", label: "Workshops", icon: CalendarDays },
    { key: "learning", label: "Courses & Roadmap", icon: GraduationCap },
    { key: "projects", label: "Projects", icon: FolderKanban },
    { key: "pitches", label: "Pitches", icon: MessageSquare },
    { key: "resources", label: "Resources", icon: Server },
    { key: "board", label: "Jobs & Internships", icon: Briefcase },
    { key: "crossdomain", label: "Cross-Domain", icon: Shuffle },
  ];

  // =======================================================
  // AUTHENTICATION FAILED
  // =======================================================

  if (authFailed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">

        <div className="flex flex-col items-center justify-center text-center px-6">

          <img
            src="/auth-failed.png"
            alt="Authentication failed"
            className="w-64 h-64 object-contain"
          />

          <h1 className="mt-6 text-2xl font-bold">
            Authentication Failed
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Your administrator session is no longer valid.
          </p>

          <p className="mt-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Returning to login...
          </p>

        </div>

      </div>
    );
  }

  // =======================================================
  // AUTHENTICATION LOADING
  // =======================================================

  if (checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">

        <div className="text-center">

          <Loader2
            size={32}
            className="animate-spin text-primary mx-auto"
          />

          <p className="mt-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Verifying administrator...
          </p>

        </div>

      </div>
    );
  }

  // =======================================================
  // NOT ADMIN
  // =======================================================

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">

        <div className="text-center">

          <ShieldAlert
            size={40}
            className="text-brand-red mx-auto"
          />

          <h1 className="mt-4 text-2xl font-bold">
            Access Denied
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Administrator access is required.
          </p>

        </div>

      </div>
    );
  }

  // =======================================================
  // ADMIN DASHBOARD
  // =======================================================


  return (
    <>
      <section className="py-12">

        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* HEADER */}

          <div className="flex flex-wrap items-end justify-between gap-4">

            <div>

              <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary">
                /admin · console
              </div>

              <h1 className="mt-2 text-3xl md:text-5xl font-bold">
                CREST{" "}
                <span className="text-gradient-brand">
                  Command
                </span>
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                Recruitment onboarding · Analytics · Organizational metrics
              </p>

            </div>

            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">

              <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-glow-pulse" />

              Live ·{" "}
              {new Date().toLocaleTimeString(
                "en-IN",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}

            </div>

          </div>

          {/* ============================================= */}
          {/* SECTION NAVIGATION (added) */}
          {/* ============================================= */}

          <div className="mt-8 flex flex-wrap gap-2">

            {SECTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSection(s.key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border font-mono text-[10px] uppercase tracking-widest transition-colors ${
                  section === s.key
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                }`}
              >
                <s.icon size={13} />
                {s.label}
              </button>
            ))}

          </div>


          {section === "overview" && (
            <>

          {/* KPI */}

          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">

            <Kpi
              icon={Users}
              label="New Applications"
              value={apps.length}
              accent="text-brand-blue"
            />

            <Kpi
              icon={CheckCircle2}
              label="Shortlisted"
              value={
                shortlistedApps.length
              }
              accent="text-brand-green"
            />

            <Kpi
              icon={XCircle}
              label="Rejected"
              value={
                rejectedApps.length
              }
              accent="text-brand-red"
            />

            <Kpi
              icon={IndianRupee}
              label="Total Revenue"
              value={fmtINR(
                REVENUE.reduce(
                  (s, r) =>
                    s + r.value,
                  0
                )
              )}
              accent="text-brand-yellow"
              small
            />

          </div>

          {/* CHARTS */}

          <div className="mt-6 grid lg:grid-cols-3 gap-4">

            {/* APPLICATION TIMELINE */}

            <ChartCard
              title="Applications · Last 14 Days"
              span="lg:col-span-2"
            >

              <ResponsiveContainer
                width="100%"
                height={260}
              >

                <AreaChart
                  data={timeline}
                >

                  <defs>

                    <linearGradient
                      id="g1"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >

                      <stop
                        offset="0%"
                        stopColor="var(--brand-blue)"
                        stopOpacity={0.6}
                      />

                      <stop
                        offset="100%"
                        stopColor="var(--brand-blue)"
                        stopOpacity={0}
                      />

                    </linearGradient>

                  </defs>

                  <CartesianGrid
                    stroke="var(--border)"
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="date"
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                  />

                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    allowDecimals={false}
                  />

                  <Tooltip
                    contentStyle={
                      tooltipStyle
                    }
                  />

                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="var(--brand-blue)"
                    fill="url(#g1)"
                    strokeWidth={2}
                  />

                </AreaChart>

              </ResponsiveContainer>

            </ChartCard>

            {/* STATUS */}

            <ChartCard title="Application Status">

              <ResponsiveContainer
                width="100%"
                height={260}
              >

                <PieChart>

                  <Pie
                    data={statusCounts}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                  >

                    {statusCounts.map(
                      (_, i) => (
                        <Cell
                          key={i}
                          fill={
                            CHART_COLORS[
                              i %
                              CHART_COLORS.length
                            ]
                          }
                        />
                      )
                    )}

                  </Pie>

                  <Tooltip
                    contentStyle={
                      tooltipStyle
                    }
                  />

                  <Legend
                    wrapperStyle={{
                      fontSize: 11,
                      fontFamily:
                        "monospace",
                    }}
                  />

                </PieChart>

              </ResponsiveContainer>

            </ChartCard>

            {/* REVENUE */}

            <ChartCard title="Revenue Distribution">

              <ResponsiveContainer
                width="100%"
                height={260}
              >

                <PieChart>

                  <Pie
                    data={REVENUE}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={95}
                    paddingAngle={2}
                  >

                    {REVENUE.map(
                      (_, i) => (
                        <Cell
                          key={i}
                          fill={
                            CHART_COLORS[
                              i %
                              CHART_COLORS.length
                            ]
                          }
                        />
                      )
                    )}

                  </Pie>

                  <Tooltip
                    contentStyle={
                      tooltipStyle
                    }
                    formatter={(
                      v: number
                    ) =>
                      fmtINR(v)
                    }
                  />

                </PieChart>

              </ResponsiveContainer>

              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] font-mono">

                {REVENUE.map(
                  (r, i) => (
                    <div
                      key={r.name}
                      className="flex items-center justify-between"
                    >

                      <span className="flex items-center gap-1.5 text-muted-foreground truncate">

                        <span
                          className="w-2 h-2 rounded-sm"
                          style={{
                            background:
                              CHART_COLORS[
                                i %
                                CHART_COLORS.length
                              ],
                          }}
                        />

                        {r.name}

                      </span>

                      <span className="text-foreground">
                        {fmtINR(
                          r.value
                        )}
                      </span>

                    </div>
                  )
                )}

              </div>

            </ChartCard>

            {/* WING APPLICATIONS */}

            <ChartCard
              title="Applications per Wing"
              span="lg:col-span-2"
            >

              <ResponsiveContainer
                width="100%"
                height={260}
              >

                <BarChart
                  data={wingCounts}
                >

                  <CartesianGrid
                    stroke="var(--border)"
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="name"
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                  />

                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    allowDecimals={false}
                  />

                  <Tooltip
                    contentStyle={
                      tooltipStyle
                    }
                  />

                  <Bar
                    dataKey="value"
                    radius={[
                      6,
                      6,
                      0,
                      0,
                    ]}
                  >

                    {wingCounts.map(
                      (_, i) => (
                        <Cell
                          key={i}
                          fill={
                            CHART_COLORS[
                              i %
                              CHART_COLORS.length
                            ]
                          }
                        />
                      )
                    )}

                  </Bar>

                </BarChart>

              </ResponsiveContainer>

            </ChartCard>

            {/* RADAR */}

            <ChartCard title="Wing Capacity Index">

              <ResponsiveContainer
                width="100%"
                height={260}
              >

                <RadarChart
                  data={wingRadar}
                >

                  <PolarGrid
                    stroke="var(--border)"
                  />

                  <PolarAngleAxis
                    dataKey="wing"
                    stroke="var(--muted-foreground)"
                    fontSize={10}
                  />

                  <Radar
                    dataKey="strength"
                    stroke="var(--brand-blue)"
                    fill="var(--brand-blue)"
                    fillOpacity={0.35}
                  />

                  <Tooltip
                    contentStyle={
                      tooltipStyle
                    }
                  />

                </RadarChart>

              </ResponsiveContainer>

            </ChartCard>

            {/* FINANCIALS */}

            <ChartCard
              title="Financials Snapshot"
              span="lg:col-span-2"
            >

              <ResponsiveContainer
                width="100%"
                height={260}
              >

                <BarChart
                  data={PROFIT}
                  layout="vertical"
                >

                  <CartesianGrid
                    stroke="var(--border)"
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    type="number"
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    tickFormatter={(v) =>
                      fmtINR(
                        v as number
                      )
                    }
                  />

                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    width={90}
                  />

                  <Tooltip
                    contentStyle={
                      tooltipStyle
                    }
                    formatter={(
                      v: number
                    ) =>
                      fmtINR(v)
                    }
                  />

                  <Bar
                    dataKey="value"
                    radius={[
                      0,
                      6,
                      6,
                      0,
                    ]}
                  >

                    {PROFIT.map(
                      (_, i) => (
                        <Cell
                          key={i}
                          fill={
                            CHART_COLORS[
                              i %
                              CHART_COLORS.length
                            ]
                          }
                        />
                      )
                    )}

                  </Bar>

                </BarChart>

              </ResponsiveContainer>

            </ChartCard>

            {/* ACHIEVEMENTS */}

            <ChartCard title="Wins by Level">

              <ResponsiveContainer
                width="100%"
                height={260}
              >

                <PieChart>

                  <Pie
                    data={
                      achievementsByLevel
                    }
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                  >

                    {achievementsByLevel.map(
                      (_, i) => (
                        <Cell
                          key={i}
                          fill={
                            CHART_COLORS[
                              i %
                              CHART_COLORS.length
                            ]
                          }
                        />
                      )
                    )}

                  </Pie>

                  <Tooltip
                    contentStyle={
                      tooltipStyle
                    }
                  />

                  <Legend
                    wrapperStyle={{
                      fontSize: 11,
                      fontFamily:
                        "monospace",
                    }}
                  />

                </PieChart>

              </ResponsiveContainer>

            </ChartCard>

          </div>

          {/* APPLICATIONS */}

          <div className="mt-8 card-tech rounded-2xl overflow-hidden">

            {/* TABS */}

            <div className="border-b border-border">

              <div className="flex overflow-x-auto">

                <TabButton
                  active={
                    activeTab === "new"
                  }
                  onClick={() => {
                    setActiveTab("new");
                    resetFilters();
                  }}
                  icon={Users}
                  label="New"
                  count={apps.length}
                />

                <TabButton
                  active={
                    activeTab ===
                    "shortlisted"
                  }
                  onClick={() => {
                    setActiveTab(
                      "shortlisted"
                    );
                    resetFilters();
                  }}
                  icon={CheckCircle2}
                  label="Shortlisted"
                  count={
                    shortlistedApps.length
                  }
                />

                <TabButton
                  active={
                    activeTab ===
                    "rejected"
                  }
                  onClick={() => {
                    setActiveTab(
                      "rejected"
                    );
                    resetFilters();
                  }}
                  icon={XCircle}
                  label="Rejected"
                  count={
                    rejectedApps.length
                  }
                />

              </div>

            </div>

            {/* FILTERS */}

            <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border">

              <div className="flex items-center gap-2">

                <Filter
                  size={14}
                  className="text-muted-foreground"
                />

                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">

                  {activeTab === "new" &&
                    "New Applications"}

                  {activeTab ===
                    "shortlisted" &&
                    "Shortlisted Applications"}

                  {activeTab ===
                    "rejected" &&
                    "Rejected Applications"}

                  {" · "}

                  {currentApps.length}

                </span>

              </div>

              <div className="flex flex-wrap items-center gap-2">

                <select
                  value={wingFilter}
                  onChange={(e) =>
                    setWingFilter(
                      e.target.value
                    )
                  }
                  className="tech-select"
                >

                  <option value="all">
                    All wings
                  </option>

                  {WINGS.map(
                    (w) => (
                      <option
                        key={w.key}
                        value={w.key}
                      >
                        {w.name}
                      </option>
                    )
                  )}

                </select>

                {activeTab === "new" && (
                  <div className="flex rounded-md border border-border overflow-hidden text-[11px] font-mono uppercase">

                    {(
                      [
                        "all",
                        "new",
                      ] as const
                    ).map(
                      (s) => (
                        <button
                          key={s}
                          onClick={() =>
                            setFilter(s)
                          }
                          className={`px-3 py-1.5 transition-colors ${
                            filter === s
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {s}
                        </button>
                      )
                    )}

                  </div>
                )}

              </div>

            </div>

            {/* LOADING */}

            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center">

                <Loader2
                  size={28}
                  className="animate-spin text-primary"
                />

                <p className="mt-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Loading applications...
                </p>

              </div>
            ) : currentApps.length === 0 ? (
              <div className="p-12 text-center">

                <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  No applications
                </div>

                <p className="mt-2 text-sm text-muted-foreground">

                  {activeTab === "new" &&
                    "New applications submitted via /apply appear here."}

                  {activeTab ===
                    "shortlisted" &&
                    "Shortlisted applicants will appear here."}

                  {activeTab ===
                    "rejected" &&
                    "Rejected applicants will appear here."}

                </p>

              </div>
            ) : (
              <div className="overflow-x-auto">

                <table className="w-full text-sm">

                  <thead className="bg-card/60 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">

                    <tr>

                      <th className="text-left px-4 py-3">
                        Applicant
                      </th>

                      <th className="text-left px-4 py-3 hidden md:table-cell">
                        Contact
                      </th>

                      <th className="text-left px-4 py-3">
                        Wing
                      </th>

                      <th className="text-left px-4 py-3 hidden lg:table-cell">
                        Skills
                      </th>

                      <th className="text-left px-4 py-3">
                        Status
                      </th>

                      <th className="text-right px-4 py-3">
                        Actions
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {currentApps.map(
                      (a) => (
                        <tr
                          key={a.id}
                          className="border-t border-border hover:bg-card/40 transition-colors"
                        >

                          <td className="px-4 py-3">

                            <div className="font-semibold">
                              {a.name}
                            </div>

                            <div className="text-[11px] font-mono text-muted-foreground">

                              {a.regNo} ·{" "}
                              {a.branch} · Y
                              {a.year}

                            </div>

                          </td>

                          <td className="px-4 py-3 hidden md:table-cell">

                            <div className="text-xs">
                              {a.email}
                            </div>

                            <div className="text-[11px] font-mono text-muted-foreground">
                              {a.phone}
                            </div>

                          </td>

                          <td className="px-4 py-3">

                            <span className="px-2 py-1 rounded-md bg-primary/10 border border-primary/30 text-[10px] font-mono uppercase tracking-widest text-primary">

                              {
                                WINGS.find(
                                  (w) =>
                                    w.key ===
                                    a.wing
                                )
                                  ?.name
                                  .replace(
                                    " Wing",
                                    ""
                                  )
                                  .replace(
                                    "CREST ",
                                    ""
                                  )
                                  ??
                                a.wing
                              }

                            </span>

                          </td>

                          <td className="px-4 py-3 hidden lg:table-cell max-w-xs truncate text-muted-foreground text-xs">

                            {a.skills}

                          </td>

                          <td className="px-4 py-3">

                            <StatusPill
                              status={
                                a.status
                              }
                            />

                          </td>

                          <td className="px-4 py-3">

                            <div className="flex justify-end gap-1">

                              {activeTab ===
                                "new" && (
                                <>

                                  <button
                                    disabled={
                                      actionLoading ===
                                      a.id
                                    }
                                    onClick={() =>
                                      setStatus(
                                        a.id,
                                        "shortlisted"
                                      )
                                    }
                                    className="p-1.5 rounded-md hover:bg-brand-green/10 text-brand-green transition-colors disabled:opacity-40"
                                    title="Shortlist"
                                  >

                                    {actionLoading ===
                                    a.id ? (
                                      <Loader2
                                        size={16}
                                        className="animate-spin"
                                      />
                                    ) : (
                                      <CheckCircle2
                                        size={16}
                                      />
                                    )}

                                  </button>

                                  <button
                                    disabled={
                                      actionLoading ===
                                      a.id
                                    }
                                    onClick={() =>
                                      setStatus(
                                        a.id,
                                        "rejected"
                                      )
                                    }
                                    className="p-1.5 rounded-md hover:bg-brand-red/10 text-brand-red transition-colors disabled:opacity-40"
                                    title="Reject"
                                  >

                                    <XCircle
                                      size={16}
                                    />

                                  </button>

                                </>
                              )}

                              {activeTab ===
                                "shortlisted" && (
                                <span className="text-[10px] font-mono uppercase tracking-widest text-brand-green">
                                  Selected
                                </span>
                              )}

                              {activeTab ===
                                "rejected" && (
                                <span className="text-[10px] font-mono uppercase tracking-widest text-brand-red">
                                  Rejected
                                </span>
                              )}

                            </div>

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>
            )}

          </div>
            </>
          )}

          {/* ============================================= */}
          {/* POLLS & NOTIFICATIONS (added, backend-wired) */}
          {/* ============================================= */}

          {section === "polls" && (
            <div className="mt-6 grid lg:grid-cols-2 gap-4">

              <Panel title="Create Poll" icon={Megaphone}>

                <FieldInput
                  label="Question"
                  value={pollQuestion}
                  onChange={setPollQuestion}
                  placeholder="What should we build next?"
                />

                <FieldInput
                  label="Options (comma separated)"
                  value={pollOptions}
                  onChange={setPollOptions}
                  placeholder="Robotics kit, Web portal, Drone"
                />

                <ActionButton onClick={addPoll} icon={Plus}>
                  Publish poll
                </ActionButton>

              </Panel>

              <Panel title="Notify Members" icon={Bell}>

                <FieldSelect
                  label="Audience"
                  value={noticeAudience}
                  onChange={setNoticeAudience}
                  options={[
                    "All members",
                    "Shortlisted applicants",
                    "Project teams",
                    "Workshop registrants",
                  ]}
                />

                <FieldTextarea
                  label="Message"
                  value={noticeText}
                  onChange={setNoticeText}
                  placeholder="Type the announcement members will receive..."
                />

                <ActionButton onClick={sendNotice} icon={Send}>
                  Send notification
                </ActionButton>

                <div className="mt-4 space-y-2">
                  {noticesLoading ? (
                    <p className="text-xs text-muted-foreground">
                      Loading notification history...
                    </p>
                  ) : notices.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No notifications sent yet.
                    </p>
                  ) : (
                    notices.map((n) => (
                      <div
                        key={n.id}
                        className="rounded-lg border border-border p-3"
                      >
                        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          {n.audience} · {n.sentAt}
                        </div>
                        <div className="mt-1 text-sm">{n.message}</div>
                      </div>
                    ))
                  )}
                </div>

              </Panel>

              {pollsLoading ? (
                <div className="lg:col-span-2 text-center text-sm text-muted-foreground py-8">
                  Loading polls...
                </div>
              ) : polls.length === 0 ? (
                <div className="lg:col-span-2 text-center text-sm text-muted-foreground py-8">
                  No polls published yet.
                </div>
              ) : (
                <div className="lg:col-span-2 grid md:grid-cols-2 gap-4">
                  {polls.map((p) => {
                    const total =
                      p.options.reduce((s, o) => s + o.votes, 0) || 1;

                    return (
                      <div
                        key={p.id}
                        className="card-tech rounded-2xl p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-semibold">{p.question}</h3>

                          <span
                            className={`px-2 py-1 rounded-md border text-[9px] font-mono uppercase tracking-widest ${
                              p.active
                                ? "text-brand-green bg-brand-green/10 border-brand-green/40"
                                : "text-muted-foreground bg-muted border-border"
                            }`}
                          >
                            {p.active ? "Live" : "Closed"}
                          </span>
                        </div>

                        <div className="mt-4 space-y-2">
                          {p.options.map((o) => (
                            <div key={o.text}>
                              <div className="flex justify-between text-xs">
                                <span>{o.text}</span>
                                <span className="font-mono text-muted-foreground">
                                  {o.votes} · {Math.round((o.votes / total) * 100)}%
                                </span>
                              </div>
                              <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full bg-primary"
                                  style={{
                                    width: `${(o.votes / total) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 flex gap-2">
                          <MiniButton onClick={() => togglePoll(p.id)}>
                            {p.active ? "Close" : "Reopen"}
                          </MiniButton>

                          <MiniButton
                            danger
                            onClick={() => removePoll(p.id)}
                          >
                            Delete
                          </MiniButton>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* ============================================= */}
{/* WORKSHOPS & EVENTS */}
{/* ============================================= */}

          {section === "events" && (
            <div className="mt-6 space-y-4">
              <Panel title="Add Workshop / Event" icon={CalendarDays}>
                <div className="grid md:grid-cols-2 gap-3">
                  <FieldSelect
                    label="Type"
                    value={eventForm.kind}
                    onChange={(value) =>
                      setEventForm({
                        ...eventForm,
                        kind: value as EventItem["kind"],
                        category:
                          value === "workshop"
                            ? "workshop"
                            : eventForm.category === "workshop"
                              ? "technical"
                              : eventForm.category,
                      })
                    }
                    options={["workshop", "event"]}
                  />

                  <FieldSelect
                    label="Category"
                    value={eventForm.category}
                    onChange={(value) =>
                      setEventForm({
                        ...eventForm,
                        category: value,
                      })
                    }
                    options={["workshop", "technical", "non-technical"]}
                  />

                  <FieldInput
                    label="Title"
                    value={eventForm.title}
                    onChange={(value) =>
                      setEventForm({ ...eventForm, title: value })
                    }
                    placeholder="Embedded Systems Bootcamp"
                  />

                  <FieldInput
                    label="Min team members"
                    value={eventForm.minTeam}
                    onChange={(value) =>
                      setEventForm({ ...eventForm, minTeam: value })
                    }
                    type="number"
                  />

                  <FieldInput
                    label="Max team members"
                    value={eventForm.maxTeam}
                    onChange={(value) =>
                      setEventForm({ ...eventForm, maxTeam: value })
                    }
                    type="number"
                  />

                  <FieldInput
                    label="Last submission date"
                    value={eventForm.lastDate}
                    onChange={(value) =>
                      setEventForm({ ...eventForm, lastDate: value })
                    }
                    type="date"
                  />

                  <FieldSelect
                    label="Status"
                    value={eventForm.status}
                    onChange={(value) =>
                      setEventForm({ ...eventForm, status: value })
                    }
                    options={["Upcoming", "Ongoing", "Past"]}
                  />
                </div>

                <FieldTextarea
                  label="Instructions"
                  value={eventForm.instructions}
                  onChange={(value) =>
                    setEventForm({ ...eventForm, instructions: value })
                  }
                  placeholder="Rules, deliverables, judging criteria..."
                />

                {eventForm.kind === "workshop" && (
                  <div className="mt-4 rounded-xl border border-border p-4">
                    <div className="mb-3 font-mono text-[10px] uppercase tracking-widest text-primary">
                      Workshop question + expected output
                    </div>

                    <div className="space-y-3">
                      <FieldInput
                        label="Question title"
                        value={eventForm.questionTitle}
                        onChange={(value) =>
                          setEventForm({
                            ...eventForm,
                            questionTitle: value,
                          })
                        }
                        placeholder="Practice · Reverse a string"
                      />

                      <FieldTextarea
                        label="Question / prompt"
                        value={eventForm.questionPrompt}
                        onChange={(value) =>
                          setEventForm({
                            ...eventForm,
                            questionPrompt: value,
                          })
                        }
                        placeholder="Describe the problem members must solve..."
                      />

                      <FieldTextarea
                        label="Starter code"
                        value={eventForm.questionStarter}
                        onChange={(value) =>
                          setEventForm({
                            ...eventForm,
                            questionStarter: value,
                          })
                        }
                        placeholder="Paste starter code..."
                      />

                      <FieldTextarea
                        label="Expected output"
                        value={eventForm.expectedOutput}
                        onChange={(value) =>
                          setEventForm({
                            ...eventForm,
                            expectedOutput: value,
                          })
                        }
                        placeholder="Expected console output..."
                      />
                    </div>
                  </div>
                )}

                <ActionButton onClick={addEvent} icon={Plus}>
                  Publish
                </ActionButton>
              </Panel>

              {events.length === 0 ? (
                <Panel title="Published content" icon={CalendarDays}>
                  <p className="text-sm text-muted-foreground">
                    No workshops or events have been published.
                  </p>
                </Panel>
              ) : (
                events.map((event) => {
                  const selectedWinner =
                    winnerForm.eventId === event.id
                      ? winnerForm.memberEmail
                      : "";

                  const winnerOptions = Array.from(
                    new Map(
                      event.registrations
                        .flatMap((registration) =>
                          registration.memberList ?? []
                        )
                        .map((member) => [member.email, member])
                    ).values()
                  );

                  return (
                    <div
                      key={event.id}
                      className="card-tech rounded-2xl p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-mono text-[10px] uppercase tracking-widest text-primary">
                            {event.kind}
                          </div>

                          <h3 className="mt-1 text-lg font-semibold">
                            {event.title}
                          </h3>

                          <p className="mt-1 max-w-2xl whitespace-pre-wrap text-sm text-muted-foreground">
                            {event.instructions}
                          </p>

                          <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                            Team {event.minTeam}–{event.maxTeam} · Deadline{" "}
                            {event.lastDate} · {event.registrations.length} teams
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={event.status ?? "Upcoming"}
                            onChange={(ev) =>
                              updateEventStatus(event, ev.target.value)
                            }
                            className="tech-select"
                          >
                            <option value="Upcoming">Upcoming</option>
                            <option value="Ongoing">Ongoing</option>
                            <option value="Past">Past</option>
                          </select>

                          <MiniButton onClick={() => exportEvent(event)}>
                            <Download size={12} /> Excel
                          </MiniButton>

                          {event.kind === "workshop" && (
                            <MiniButton
                              onClick={() => updateEventQuestion(event)}
                            >
                              <ClipboardList size={12} /> Update question
                            </MiniButton>
                          )}

                          <MiniButton
                            danger
                            onClick={() => removeEvent(event.id)}
                          >
                            <Trash2 size={12} /> Remove
                          </MiniButton>
                        </div>
                      </div>

                      {event.kind === "workshop" && event.question && (
                        <div className="mt-4 rounded-lg border border-border p-4">
                          <div className="font-mono text-[10px] uppercase tracking-widest text-primary">
                            {event.question.title}
                          </div>
                          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                            {event.question.prompt}
                          </p>
                          {event.question.expectedOutput && (
                            <div className="mt-3">
                              <div className="font-mono text-[9px] uppercase tracking-widest text-green-400">
                                Expected output
                              </div>
                              <pre className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">
                                {event.question.expectedOutput}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}

                      {event.registrations.length > 0 && (
                        <div className="mt-4 overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-card/60 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                              <tr>
                                <th className="px-3 py-2 text-left">Team</th>
                                <th className="px-3 py-2 text-left">Leader</th>
                                <th className="px-3 py-2 text-left">Members</th>
                                <th className="px-3 py-2 text-left">Submitted</th>
                              </tr>
                            </thead>
                            <tbody>
                              {event.registrations.map((registration) => (
                                <tr
                                  key={registration.id}
                                  className="border-t border-border"
                                >
                                  <td className="px-3 py-2 font-semibold">
                                    {registration.team}
                                  </td>
                                  <td className="px-3 py-2">
                                    {registration.leader}
                                  </td>
                                  <td className="px-3 py-2 text-xs text-muted-foreground">
                                    {registration.members}
                                  </td>
                                  <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
                                    {registration.submitted}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      <div className="mt-5 rounded-xl border border-border p-4">
                        <div className="mb-3 font-mono text-[10px] uppercase tracking-widest text-primary">
                          Event winner
                        </div>

                        {winnerOptions.length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            A winner can be selected after members register.
                          </p>
                        ) : (
                          <div className="grid md:grid-cols-2 gap-3">
                            <FieldSelect
                              label="Winning member"
                              value={selectedWinner}
                              onChange={(value) =>
                                setWinnerForm({
                                  ...winnerForm,
                                  eventId: event.id,
                                  memberEmail: value,
                                })
                              }
                              options={[
                                "",
                                ...winnerOptions.map(
                                  (member) => member.email
                                ),
                              ]}
                              labels={{
                                "": "Select winner",
                                ...Object.fromEntries(
                                  winnerOptions.map((member) => [
                                    member.email,
                                    `${member.name} · ${member.wing}`,
                                  ])
                                ),
                              }}
                            />

                            <FieldInput
                              label="Achievement"
                              value={
                                winnerForm.eventId === event.id
                                  ? winnerForm.name
                                  : ""
                              }
                              onChange={(value) =>
                                setWinnerForm({
                                  ...winnerForm,
                                  eventId: event.id,
                                  name: value,
                                })
                              }
                              placeholder={`${event.title} Winner`}
                            />

                            <FieldInput
                              label="Year"
                              value={
                                winnerForm.eventId === event.id
                                  ? winnerForm.year
                                  : String(new Date().getFullYear())
                              }
                              onChange={(value) =>
                                setWinnerForm({
                                  ...winnerForm,
                                  eventId: event.id,
                                  year: value,
                                })
                              }
                            />

                            <FieldSelect
                              label="Applicant status"
                              value={
                                winnerForm.eventId === event.id
                                  ? winnerForm.status
                                  : "winner"
                              }
                              onChange={(value) =>
                                setWinnerForm({
                                  ...winnerForm,
                                  eventId: event.id,
                                  status: value,
                                })
                              }
                              options={["winner", "result", "shortlisted"]}
                            />

                            <ActionButton
                              onClick={() => chooseWinner(event)}
                              icon={CheckCircle2}
                            >
                              Save winner
                            </ActionButton>
                          </div>
                        )}

                        {event.winnerName && (
                          <p className="mt-3 text-xs text-green-400">
                            Current winner: {event.winnerName} ·{" "}
                            {event.winnerStatus ?? "winner"}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

{/* ============================================= */}
{/* COURSES & SKILL ROADMAP + ASSIGNMENTS */}
{/* ============================================= */}

          {section === "learning" && (
            <div className="mt-6 space-y-4">
              <div className="grid lg:grid-cols-2 gap-4">
                <Panel title="Add Course / Roadmap Item" icon={GraduationCap}>
                  <FieldSelect
                    label="Content type"
                    value={learningForm.type}
                    onChange={(value) =>
                      setLearningForm({
                        ...learningForm,
                        type: value as LearningItem["type"],
                      })
                    }
                    options={["course", "roadmap"]}
                  />

                  <FieldInput
                    label="Title"
                    value={learningForm.title}
                    onChange={(value) =>
                      setLearningForm({
                        ...learningForm,
                        title: value,
                      })
                    }
                    placeholder="React + TanStack Fundamentals"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <FieldInput
                      label="Skill"
                      value={learningForm.skill}
                      onChange={(value) =>
                        setLearningForm({
                          ...learningForm,
                          skill: value,
                        })
                      }
                      placeholder="Frontend Dev"
                    />

                    <FieldInput
                      label="Track"
                      value={learningForm.track}
                      onChange={(value) =>
                        setLearningForm({
                          ...learningForm,
                          track: value,
                        })
                      }
                      placeholder="Frontend Dev"
                    />
                  </div>

                  <FieldTextarea
                    label="Detail"
                    value={learningForm.detail}
                    onChange={(value) =>
                      setLearningForm({
                        ...learningForm,
                        detail: value,
                      })
                    }
                    placeholder="What should the member learn?"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <FieldSelect
                      label="Level"
                      value={learningForm.level}
                      onChange={(value) =>
                        setLearningForm({
                          ...learningForm,
                          level: value as LearningItem["level"],
                        })
                      }
                      options={["Beginner", "Intermediate", "Advanced"]}
                    />

                    <FieldInput
                      label="Duration"
                      value={learningForm.duration}
                      onChange={(value) =>
                        setLearningForm({
                          ...learningForm,
                          duration: value,
                        })
                      }
                      placeholder="4 weeks"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FieldInput
                      label="Mentor"
                      value={learningForm.mentor}
                      onChange={(value) =>
                        setLearningForm({
                          ...learningForm,
                          mentor: value,
                        })
                      }
                    />

                    <FieldInput
                      label="Resource link"
                      value={learningForm.link}
                      onChange={(value) =>
                        setLearningForm({
                          ...learningForm,
                          link: value,
                        })
                      }
                      placeholder="https://..."
                    />
                  </div>

                  <FieldTextarea label="Roadmap steps (one per line: Step title | https://link)" value={learningForm.stepsText} onChange={(value) => setLearningForm({ ...learningForm, stepsText: value })} placeholder={"HTML & CSS | https://example.com/html\nReact | https://example.com/react\nBuild project | https://example.com/project"} />

                  <ActionButton onClick={addLearning} icon={Plus}>
                    Add {learningForm.type}
                  </ActionButton>
                </Panel>

                <Panel title="Published Skill Building Courses" icon={RouteIcon}>
                  {learning.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No course or roadmap content published.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {learning.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg border border-border p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-sm">
                                  {item.title}
                                </span>
                                <span className="font-mono text-[9px] uppercase tracking-widest text-primary">
                                  {item.type}
                                </span>
                              </div>

                              <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                                {item.skill || item.track || "General"} ·{" "}
                                {item.duration || "self-paced"} ·{" "}
                                {item.mentor || "unassigned"}
                              </div>

                              {item.link && (
                                <div className="mt-1 text-[11px] text-sky-400 break-all">
                                  {item.link}
                                </div>
                              )}
                            </div>

                            <MiniButton
                              danger
                              onClick={() => removeLearning(item.id)}
                            >
                              <Trash2 size={12} /> Remove
                            </MiniButton>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>
              </div>

              <Panel title="Create Wing Assignment" icon={ClipboardList}>
                <div className="grid md:grid-cols-2 gap-3">
                  <FieldInput
                    label="Assignment title"
                    value={assignmentForm.title}
                    onChange={(value) =>
                      setAssignmentForm({
                        ...assignmentForm,
                        title: value,
                      })
                    }
                    placeholder="Week 4 · API integration"
                  />

                  <FieldSelect
                    label="Target wing"
                    value={assignmentForm.wing}
                    onChange={(value) =>
                      setAssignmentForm({
                        ...assignmentForm,
                        wing: value,
                      })
                    }
                    options={[
                      "All members",
                      ...WINGS.map((wing) => wing.key),
                    ]}
                    labels={{
                      "All members": "All members",
                      ...Object.fromEntries(
                        WINGS.map((wing) => [wing.key, wing.name])
                      ),
                    }}
                  />

                  <FieldInput
                    label="Assignment link"
                    value={assignmentForm.link}
                    onChange={(value) =>
                      setAssignmentForm({
                        ...assignmentForm,
                        link: value,
                      })
                    }
                    placeholder="https://..."
                  />

                  <FieldInput
                    label="Due date"
                    value={assignmentForm.dueDate}
                    onChange={(value) =>
                      setAssignmentForm({
                        ...assignmentForm,
                        dueDate: value,
                      })
                    }
                    type="date"
                  />
                </div>

                <FieldTextarea
                  label="Instructions"
                  value={assignmentForm.description}
                  onChange={(value) =>
                    setAssignmentForm({
                      ...assignmentForm,
                      description: value,
                    })
                  }
                  placeholder="What should this wing complete?"
                />

                <ActionButton onClick={addAssignment} icon={Plus}>
                  Send assignment
                </ActionButton>

                <div className="mt-4 space-y-2">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
                    >
                      <div>
                        <div className="text-sm font-semibold">
                          {assignment.title}
                        </div>
                        <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-primary">
                          {assignment.wing} · {assignment.dueDate || "No deadline"}
                        </div>
                      </div>

                      <MiniButton
                        danger
                        onClick={() => removeAssignment(assignment.id)}
                      >
                        <Trash2 size={12} /> Remove
                      </MiniButton>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          )}

{/* ============================================= */}
          {/* PROJECTS · TEAMS · ASSIGNMENTS (added) */}
          {/* ============================================= */}

          {section === "projects" && (
            <div className="mt-6 space-y-4">

              <div className="grid lg:grid-cols-2 gap-4">

                <Panel title="Create Project" icon={FolderKanban}>

                  <FieldInput
                    label="Project title"
                    value={projectForm.title}
                    onChange={(v) =>
                      setProjectForm({ ...projectForm, title: v })
                    }
                  />

                  <FieldInput
                    label="Domain"
                    value={projectForm.domain}
                    onChange={(v) =>
                      setProjectForm({ ...projectForm, domain: v })
                    }
                    placeholder="Web / Hardware / AI"
                  />

                  <ActionButton onClick={addProject} icon={Plus}>
                    Create
                  </ActionButton>

                </Panel>

                <Panel title="Build Team · Send Request" icon={UserPlus}>

                  <FieldSelect
                    label="Project"
                    value={memberForm.projectId}
                    onChange={(v) =>
                      setMemberForm({ ...memberForm, projectId: v })
                    }
                    options={["", ...projects.map((p) => p.id)]}
                    labels={{
                      "": "Select project",
                      ...Object.fromEntries(
                        projects.map((p) => [p.id, p.title])
                      ),
                    }}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <FieldInput
                      label="Member"
                      value={memberForm.name}
                      onChange={(v) =>
                        setMemberForm({ ...memberForm, name: v })
                      }
                    />

                    <FieldInput
                      label="Role"
                      value={memberForm.role}
                      onChange={(v) =>
                        setMemberForm({ ...memberForm, role: v })
                      }
                      placeholder="Backend Dev"
                    />
                  </div>

                  <FieldInput
                    label="Assignment"
                    value={memberForm.assignment}
                    onChange={(v) =>
                      setMemberForm({ ...memberForm, assignment: v })
                    }
                    placeholder="Build the invite API"
                  />

                  <ActionButton onClick={inviteMember} icon={Send}>
                    Send request
                  </ActionButton>

                </Panel>

              </div>

              {projects.map((p) => (
                <div key={p.id} className="card-tech rounded-2xl p-5">

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{p.title}</h3>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        {p.domain} · {p.members.length} members
                      </div>
                    </div>

                    <select
                      value={p.status}
                      onChange={(ev) =>
                        setProjectStatus(
                          p.id,
                          ev.target.value as ProjectItem["status"]
                        )
                      }
                      className="tech-select"
                    >
                      <option value="planning">planning</option>
                      <option value="running">running</option>
                      <option value="completed">completed</option>
                    </select>
                  </div>

                  <div className="mt-4 space-y-2">
                    {p.members.map((m) => (
                      <div
                        key={m.name}
                        className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3"
                      >
                        <div className="min-w-[140px]">
                          <div className="text-sm font-semibold">{m.name}</div>
                          <div className="font-mono text-[10px] uppercase tracking-widest text-primary">
                            {m.role}
                          </div>
                        </div>

                        <input
                          value={m.assignment}
                          onChange={(ev) =>
                            updateAssignment(p.id, m.name, ev.target.value)
                          }
                          className="tech-input flex-1 min-w-[180px]"
                          placeholder="Assignment"
                        />

                        {m.state === "invited" ? (
                          <MiniButton
                            onClick={() => markMemberActive(p.id, m.name)}
                          >
                            Mark accepted
                          </MiniButton>
                        ) : (
                          <span className="font-mono text-[10px] uppercase tracking-widest text-brand-green">
                            Active
                          </span>
                        )}
                      </div>
                    ))}

                    {p.members.length === 0 && (
                      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        No members yet
                      </div>
                    )}
                  </div>

                </div>
              ))}

            </div>
          )}

          {/* ============================================= */}
          {/* PITCHES (added) */}
          {/* ============================================= */}

          {section === "pitches" && (
            <div className="mt-6 grid md:grid-cols-2 gap-4">
              {pitches.map((p) => (
                <div key={p.id} className="card-tech rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{p.title}</h3>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        by {p.member}
                      </div>
                    </div>

                    <span className="px-2 py-1 rounded-md border border-border text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
                      {p.status}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-muted-foreground">
                    {p.summary}
                  </p>

                  <div className="mt-4 flex gap-2">
                    <MiniButton
                      onClick={() => setPitchStatus(p.id, "accepted")}
                    >
                      Accept
                    </MiniButton>

                    <MiniButton
                      danger
                      onClick={() => setPitchStatus(p.id, "declined")}
                    >
                      Decline
                    </MiniButton>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ============================================= */}
          {/* RESOURCES (added) */}
          {/* ============================================= */}

          {section === "resources" && (
            <div className="mt-6 card-tech rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-card/60 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-3">Resource</th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">
                      Category
                    </th>
                    <th className="text-left px-4 py-3">Currently used by</th>
                    <th className="text-left px-4 py-3">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {resources.map((r) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="px-4 py-3 font-semibold">{r.name}</td>

                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                        {r.category}
                      </td>

                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {r.usedBy}
                      </td>

                      <td className="px-4 py-3">
                        <select
                          value={r.status}
                          onChange={(ev) =>
                            setResourceStatus(
                              r.id,
                              ev.target.value as ResourceItem["status"]
                            )
                          }
                          className="tech-select"
                        >
                          <option value="available">available</option>
                          <option value="in-use">in-use</option>
                          <option value="maintenance">maintenance</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ============================================= */}
          {/* INTERNSHIP / JOB BOARD (added) */}
          {/* ============================================= */}

          {section === "board" && (
            <div className="mt-6 grid lg:grid-cols-2 gap-4">

              <Panel title="Post Opening" icon={Briefcase}>

                <div className="grid grid-cols-2 gap-3">
                  <FieldInput
                    label="Company"
                    value={openingForm.company}
                    onChange={(v) =>
                      setOpeningForm({ ...openingForm, company: v })
                    }
                  />

                  <FieldInput
                    label="Role"
                    value={openingForm.role}
                    onChange={(v) =>
                      setOpeningForm({ ...openingForm, role: v })
                    }
                  />

                  <FieldSelect
                    label="Type"
                    value={openingForm.kind}
                    onChange={(v) =>
                      setOpeningForm({
                        ...openingForm,
                        kind: v as Opening["kind"],
                      })
                    }
                    options={["internship", "job"]}
                  />

                  <FieldInput
                    label="Stipend / CTC"
                    value={openingForm.stipend}
                    onChange={(v) =>
                      setOpeningForm({ ...openingForm, stipend: v })
                    }
                  />

                  <FieldInput
                    label="Deadline"
                    value={openingForm.deadline}
                    onChange={(v) =>
                      setOpeningForm({ ...openingForm, deadline: v })
                    }
                    type="date"
                  />
                </div>

                <ActionButton onClick={addOpening} icon={Plus}>
                  Publish opening
                </ActionButton>

              </Panel>

              <Panel title="Live Board" icon={ClipboardList}>

                <div className="space-y-2">
                  {openings.map((o) => (
                    <div
                      key={o.id}
                      className="rounded-lg border border-border p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm">
                          {o.role} · {o.company}
                        </span>

                        <span className="font-mono text-[9px] uppercase tracking-widest text-primary">
                          {o.kind}
                        </span>
                      </div>

                      <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        {o.stipend || "unpaid"} · closes {o.deadline || "—"} ·{" "}
                        {o.active ? "open" : "closed"}
                      </div>

                      <div className="mt-2 flex gap-2">
                        <MiniButton onClick={() => toggleOpening(o.id)}>
                          {o.active ? "Close" : "Reopen"}
                        </MiniButton>

                        <MiniButton danger onClick={() => removeOpening(o.id)}>
                          Delete
                        </MiniButton>
                      </div>
                    </div>
                  ))}
                </div>

              </Panel>

            </div>
          )}

          {/* ============================================= */}
          {/* CROSS-DOMAIN REQUESTS (added) */}
          {/* ============================================= */}

          {section === "crossdomain" && (
            <div className="mt-6 space-y-3">
              {crossRequests.map((c) => (
                <div
                  key={c.id}
                  className="card-tech rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4"
                >
                  <div>
                    <div className="font-semibold">{c.member}</div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-primary">
                      {c.fromWing} → {c.toWing}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {c.reason}
                    </p>
                  </div>

                  {c.status === "pending" ? (
                    <div className="flex gap-2">
                      <MiniButton
                        onClick={() => setCrossStatus(c.id, "accepted")}
                      >
                        <CheckCircle2 size={12} /> Accept
                      </MiniButton>

                      <MiniButton
                        danger
                        onClick={() => setCrossStatus(c.id, "declined")}
                      >
                        <XCircle size={12} /> Decline
                      </MiniButton>
                    </div>
                  ) : (
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {c.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}


        </div>

      </section>

      <style>{`
        .tech-select {
          background: oklch(0.15 0.02 260 / 0.6);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 6px 10px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-family: ui-monospace, monospace;
          color: var(--foreground);
        }
        .tech-input {
          background: oklch(0.15 0.02 260 / 0.6);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 13px;
          color: var(--foreground);
          outline: none;
        }
        .tech-input:focus {
          border-color: var(--primary);
        }
      `}</style>
    </>
  );
}


// =========================================================
// TAB BUTTON
// =========================================================

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{
    className?: string;
    strokeWidth?: number;
  }>;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3.5 font-mono text-[10px] uppercase tracking-widest border-b-2 transition-colors ${
        active
          ? "border-primary text-primary bg-primary/5"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >

      <Icon size={14} />

      {label}

      <span
        className={`px-1.5 py-0.5 rounded text-[9px] ${
          active
            ? "bg-primary/10"
            : "bg-muted"
        }`}
      >
        {count}
      </span>

    </button>
  );
}

// =========================================================
// KPI
// =========================================================

function Kpi({
  icon: Icon,
  label,
  value,
  accent,
  small,
}: {
  icon: React.ComponentType<{
    className?: string;
    strokeWidth?: number;
  }>;
  label: string;
  value: string | number;
  accent: string;
  small?: boolean;
}) {
  return (
    <div className="card-tech rounded-xl p-5 relative overflow-hidden group hover:border-primary/60 transition-colors">

      <div className="flex items-center justify-between">

        <Icon
          className={`w-5 h-5 ${accent}`}
          strokeWidth={1.5}
        />

        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
          LIVE
        </span>

      </div>

      <div
        className={`mt-4 font-bold ${
          small
            ? "text-xl md:text-2xl"
            : "text-3xl md:text-4xl"
        }`}
      >
        {value}
      </div>

      <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>

    </div>
  );
}

// =========================================================
// STATUS PILL
// =========================================================

function StatusPill({
  status,
}: {
  status: Application["status"];
}) {
  const cfg = {
    new: {
      c: "text-brand-blue",
      bg: "bg-brand-blue/10",
      b: "border-brand-blue/40",
    },

    shortlisted: {
      c: "text-brand-green",
      bg: "bg-brand-green/10",
      b: "border-brand-green/40",
    },

    rejected: {
      c: "text-brand-red",
      bg: "bg-brand-red/10",
      b: "border-brand-red/40",
    },
  }[status];

  return (
    <span
      className={`px-2 py-1 rounded-md border text-[10px] font-mono uppercase tracking-widest ${cfg.c} ${cfg.bg} ${cfg.b}`}
    >
      {status}
    </span>
  );
}

// =========================================================
// CHART CARD
// =========================================================

function ChartCard({
  title,
  span = "",
  children,
}: {
  title: string;
  span?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`card-tech rounded-2xl p-5 ${span}`}
    >

      <div className="flex items-center justify-between mb-2">

        <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {title}
        </h3>

        <TrendingUp
          size={12}
          className="text-muted-foreground"
        />

      </div>

      {children}

    </div>
  );
}

// =========================================================
// TOOLTIP
// =========================================================

const tooltipStyle = {
  background:
    "oklch(0.13 0.015 260)",

  border:
    "1px solid var(--border)",

  borderRadius: 8,

  fontSize: 12,
};

// =========================================================
// PANEL (added)
// =========================================================

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="card-tech rounded-2xl p-5">

      <div className="flex items-center gap-2 mb-4">

        <Icon size={14} className="text-primary" />

        <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {title}
        </h3>

      </div>

      <div className="space-y-3">{children}</div>

    </div>
  );
}

// =========================================================
// FORM FIELDS (added)
// =========================================================

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">

      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>

      <input
        type={type}
        value={value}
        placeholder={placeholder ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="tech-input mt-1 w-full"
      />

    </label>
  );
}

function FieldTextarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">

      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>

      <textarea
        rows={3}
        value={value}
        placeholder={placeholder ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="tech-input mt-1 w-full resize-y"
      />

    </label>
  );
}

function FieldSelect({
  label,
  value,
  onChange,
  options,
  labels,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  labels?: Record<string, string>;
}) {
  return (
    <label className="block">

      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="tech-select mt-1 w-full"
      >

        {options.map((o) => (
          <option key={o} value={o}>
            {labels?.[o] ?? o}
          </option>
        ))}

      </select>

    </label>
  );
}

// =========================================================
// BUTTONS (added)
// =========================================================

function ActionButton({
  onClick,
  icon: Icon,
  children,
}: {
  onClick: () => void;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90"
    >
      <Icon size={13} />
      {children}
    </button>
  );
}

function MiniButton({
  onClick,
  children,
  danger,
}: {
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors ${
        danger
          ? "border-brand-red/40 text-brand-red hover:bg-brand-red/10"
          : "border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
      }`}
    >
      {children}
    </button>
  );
}