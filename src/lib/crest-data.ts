export type Wing = {
  key: string;
  name: string;
  tagline: string;
  color: string; // tailwind text color class
  bg: string;
  description: string;
  focus: string[];
};

export const WINGS: Wing[] = [
  {
    key: "cse",
    name: "CSE Wing",
    tagline: "Software · AI · Systems",
    color: "text-brand-blue",
    bg: "from-brand-blue/20 to-transparent",
    description:
      "Software engineering, competitive programming, AI/ML research, full-stack builds and hackathon squads.",
    focus: ["Python & C workshops", "Full-stack projects", "Agentic AI", "Hackathon teams"],
  },
  {
    key: "electronics",
    name: "Electronics Wing",
    tagline: "Circuits · Embedded · IoT",
    color: "text-brand-green",
    bg: "from-brand-green/20 to-transparent",
    description:
      "PCB design, embedded systems, IoT and hardware hacking — turning ideas into physical prototypes.",
    focus: ["Embedded firmware", "PCB & sensors", "IoT builds", "Hardware R&D"],
  },
  {
    key: "aerospace",
    name: "Aerospace Wing",
    tagline: "Rocketry · CAD · Sim",
    color: "text-brand-red",
    bg: "from-brand-red/20 to-transparent",
    description:
      "Model rocketry, CANSAT missions and 3D CAD engineering — award-winning at ISRO / IN-SPACe competitions.",
    focus: ["Model rocketry", "3D CAD design", "CANSAT missions", "Flight sim"],
  },
  {
    key: "robotics",
    name: "Robotics Wing",
    tagline: "Mechatronics · Autonomy",
    color: "text-brand-yellow",
    bg: "from-brand-yellow/20 to-transparent",
    description:
      "Autonomous ground robots, computer-vision-driven systems and mechatronic builds for Robofest & beyond.",
    focus: ["Mobile robots", "Vision & control", "Robofest team", "Actuator design"],
  },
  {
    key: "creatives",
    name: "CREST Creatives",
    tagline: "Design · Media · Brand",
    color: "text-brand-yellow",
    bg: "from-brand-yellow/20 to-transparent",
    description:
      "Visual identity, social media, motion graphics and event branding — the storytelling engine of CREST.",
    focus: ["Social media", "Motion design", "Photography", "Event branding"],
  },
  {
    key: "management",
    name: "CREST Management",
    tagline: "Ops · Outreach · Sponsorship",
    color: "text-brand-blue",
    bg: "from-brand-blue/20 to-transparent",
    description:
      "Operations, sponsorships, recruitment and event execution — the backbone that runs every CREST initiative.",
    focus: ["Sponsorships", "Recruitment", "Event ops", "Outreach"],
  },
];

export const LEADERSHIP = [
  { role: "CEO", name: "Priyansh Patel", initials: "PP" },
  { role: "Co-CEO", name: "Vinay Bharadwaj", initials: "VB" },
  { role: "COO", name: "Saksham Sharma", initials: "SS" },
  { role: "CTO", name: "Gunti Joy", initials: "GJ" },
];

export const EVENTS = [
  {
    name: "Innotek 2026",
    date: "21–22 Apr 2026",
    tag: "Expo",
    detail: "700+ innovations, 26 schools — CREST members earned university-level recognition.",
  },
  {
    name: "Resurgence",
    date: "11–12 Mar 2026",
    tag: "Hackathon",
    detail: "CREST's flagship hackathon — 300+ teams, project funding, national reach.",
  },
  {
    name: "Cognitia '26",
    date: "10–12 Mar 2026",
    tag: "Techfest",
    detail: "4,000+ students, 18+ events — CREST ran promo, registrations, decor & setup.",
  },
  {
    name: "Smart India Hackathon",
    date: "2026",
    tag: "National",
    detail: "CREST under DSRP led organizing for SIH Internals & Grand Finale.",
  },
  { name: "C Workshop", date: "27 Oct – 14 Nov 2025", tag: "Workshop", detail: "Foundational C programming, taught by CSE Wing." },
  { name: "Python Workshop", date: "20 Aug – 17 Oct 2025", tag: "Workshop", detail: "Two-month Python journey for freshers." },
];

export type Achievement = {
  event: string;
  pos: string;
  level: "International" | "National" | "Regional" | "University";
  wing?: string;
  priority: number; // 1 = flagship / hero, 5 = filler
  year?: string;
};

export const ACHIEVEMENTS: Achievement[] = [
  { event: "AIU Anveshan International 2025", pos: "1st · Gold", level: "International", wing: "aerospace", priority: 1, year: "2025" },
  { event: "Google Agentic AI Hackathon 2025", pos: "Finalist · Top 2%", level: "National", wing: "cse", priority: 1, year: "2025" },
  { event: "ISRO Model Rocketry 2025", pos: "Best Design", level: "National", wing: "aerospace", priority: 1, year: "2025" },
  { event: "Greenovation · IIT Delhi 2025", pos: "1st", level: "National", wing: "robotics", priority: 2, year: "2025" },
  { event: "Process Wars · IIT Ropar 2026", pos: "1st", level: "National", wing: "robotics", priority: 2, year: "2026" },
  { event: "Cine Canvas · IIT Ropar 2026", pos: "1st", level: "National", wing: "creatives", priority: 2, year: "2026" },
  { event: "Brand Wars · IIT Mandi 2026", pos: "1st", level: "National", wing: "management", priority: 2, year: "2026" },
  { event: "AIU Anveshan North Zone 2026", pos: "1st", level: "Regional", wing: "aerospace", priority: 3, year: "2026" },
  { event: "CoasterX · IIT Ropar 2026", pos: "2nd", level: "National", wing: "electronics", priority: 3, year: "2026" },
  { event: "Beyond Zenith · IIT Ropar 2026", pos: "3rd", level: "National", wing: "aerospace", priority: 3, year: "2026" },
  { event: "Pitcher Perfect · IIT Mandi 2026", pos: "2nd", level: "National", wing: "management", priority: 3, year: "2026" },
  { event: "Zinnovatio · CU 2025", pos: "Best Hardware", level: "National", wing: "electronics", priority: 3, year: "2025" },
  { event: "Innotek 2026", pos: "Best Creativity", level: "University", wing: "creatives", priority: 4, year: "2026" },
  { event: "ISRO-LPU National Space Day Pitch", pos: "1st", level: "University", wing: "aerospace", priority: 4, year: "2025" },
];

export const REVENUE = [
  { name: "Robofest 5.0", value: 250000 },
  { name: "AIU International", value: 75000 },
  { name: "IIT Mandi", value: 22000 },
  { name: "Zinnovatio", value: 12000 },
  { name: "Innotek", value: 10000 },
  { name: "IIT Delhi", value: 7000 },
  { name: "Beyond Zenith", value: 5000 },
];

export const PROFIT = [
  { name: "Profit", value: 139800 },
  { name: "Prize Money", value: 100000 },
  { name: "Expenses", value: 18000 },
];

export type Application = {
  id: string;
  name: string;
  email: string;
  phone: string;
  regNo: string;
  branch: string;
  year: string;
  wing: string;
  skills: string;
  why: string;
  portfolio?: string;
  createdAt: string;
  status: "new" | "shortlisted" | "rejected";
};

const KEY = "crest_applications_v1";

export function loadApplications(): Application[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Application[];
  } catch {
    return [];
  }
}

export function saveApplication(app: Omit<Application, "id" | "createdAt" | "status">) {
  const all = loadApplications();
  const record: Application = {
    ...app,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: "new",
  };
  all.unshift(record);
  localStorage.setItem(KEY, JSON.stringify(all));
  return record;
}

export function updateApplicationStatus(id: string, status: Application["status"]) {
  const all = loadApplications().map((a) => (a.id === id ? { ...a, status } : a));
  localStorage.setItem(KEY, JSON.stringify(all));
  return all;
}

const SEED_NAMES = [
  "Aarav Mehta", "Ishita Verma", "Rohan Kapoor", "Priya Singh", "Karan Malhotra",
  "Ananya Rao", "Vikram Iyer", "Sneha Reddy", "Aditya Nair", "Meera Joshi",
  "Kabir Bansal", "Riya Chawla", "Arjun Deshpande", "Nikita Sen", "Yash Agarwal",
  "Tanya Bhatt", "Devansh Gupta", "Sara Khan", "Manav Shah", "Aisha Ali",
];

export function seedApplications() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(KEY)) return;
  const wings = WINGS.map((w) => w.key);
  const branches = ["CSE", "ECE", "Mechanical", "Aerospace", "EEE", "MechTronics"];
  const statuses: Application["status"][] = ["new", "new", "shortlisted", "rejected", "new", "shortlisted"];
  const skills = [
    "Python, React, Docker", "Arduino, KiCad, C++", "Fusion 360, ANSYS, CFD",
    "ROS, OpenCV, PyTorch", "Figma, After Effects, Illustrator", "Notion, Excel, Sponsorship",
    "Next.js, PostgreSQL, LLMs", "PCB layout, RF, IoT", "Rocketry, CANSAT",
  ];
  const seeded: Application[] = SEED_NAMES.map((name, i) => {
    const d = new Date();
    d.setDate(d.getDate() - Math.floor(Math.random() * 14));
    return {
      id: crypto.randomUUID(),
      name,
      email: name.toLowerCase().replace(/\s+/g, ".") + "@lpu.in",
      phone: "+91 9" + Math.floor(100000000 + Math.random() * 899999999),
      regNo: "120" + (10000 + i).toString(),
      branch: branches[i % branches.length],
      year: String(1 + (i % 4)),
      wing: wings[i % wings.length],
      skills: skills[i % skills.length],
      why: "Excited to build and compete with CREST.",
      createdAt: d.toISOString(),
      status: statuses[i % statuses.length],
    };
  });
  localStorage.setItem(KEY, JSON.stringify(seeded));
}

