import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteShell } from "@/components/site-shell";
import { BookOpen, Calendar, Users, ArrowRight, Clock, Sparkles } from "lucide-react";

export const Route = createFileRoute("/workshops/")({
  head: () => ({
    meta: [
      { title: "Workshops · CREST" },
      {
        name: "description",
        content:
          "Hands-on technical workshops organized by CREST wings: Python, C, Electronics Basics, 3D CAD & Rocketry.",
      },
    ],
  }),
  component: WorkshopsHubPage,
});

type Tab = "ongoing" | "upcoming" | "scheduled";

type WorkshopCardData = {
  id: string;
  title: string;
  wing: string;
  wingTone: "sky" | "green" | "yellow" | "red";
  dateRange: string;
  description: string;
  instructor: string;
  enrolledCount: number;
};

const MOCK_WORKSHOPS: Record<Tab, WorkshopCardData[]> = {
  ongoing: [
    {
      id: "python-autonomous",
      title: "Python Workshop: Autonomous & Embedded Systems",
      wing: "Software Wing",
      wingTone: "sky",
      dateRange: "Aug 20 – Oct 17, 2026",
      description:
        "Master foundational Python, object-oriented concepts, sensor data processing, and API integration for autonomous robotic control.",
      instructor: "Aarav Sharma · Lead Software Wing",
      enrolledCount: 42,
    },
    {
      id: "c-microcontrollers",
      title: "C Workshop: Microcontrollers & Firmware Design",
      wing: "Electronics Wing",
      wingTone: "green",
      dateRange: "Aug 25 – Oct 22, 2026",
      description:
        "Deep dive into bare-metal C programming, register manipulation, interrupts, and UART/SPI/I2C communication protocols.",
      instructor: "Ishita Rao · Core Electronics Lead",
      enrolledCount: 38,
    },
  ],
  upcoming: [
    {
      id: "electronics-basics",
      title: "Electronics Basics & PCB Design Essentials",
      wing: "Electronics Wing",
      wingTone: "green",
      dateRange: "Nov 02 – Nov 28, 2026",
      description:
        "Learn circuit theory, schematic capture, component selection, and hands-on PCB layout using KiCAD from scratch.",
      instructor: "Kabir Singh · Hardware Specialist",
      enrolledCount: 29,
    },
    {
      id: "cad-rocketry",
      title: "3D CAD Modeling & Rocketry Flight Dynamics",
      wing: "Rocketry Wing",
      wingTone: "red",
      dateRange: "Nov 10 – Dec 12, 2026",
      description:
        "SolidWorks surface modeling, aerodynamic nozzle design, flight trajectory simulation, and structural stress analysis.",
      instructor: "Meera Nair · Rocketry Airframe Lead",
      enrolledCount: 31,
    },
    {
      id: "ros2-robotics",
      title: "ROS2 & Autonomous Mobile Robot Navigation",
      wing: "Mechatronics Wing",
      wingTone: "yellow",
      dateRange: "Nov 15 – Dec 20, 2026",
      description:
        "Build robot operating system nodes, process LiDAR point clouds, and configure SLAM navigation stacks for mobile rovers.",
      instructor: "Devansh Varma · Mechatronics Lead",
      enrolledCount: 24,
    },
  ],
  scheduled: [
    {
      id: "embedded-linux",
      title: "Embedded Linux & RTOS Systems",
      wing: "Electronics Wing",
      wingTone: "green",
      dateRange: "Jan 12 – Feb 20, 2027",
      description:
        "Bootloaders, custom Linux kernel compilation, Device Trees, and Real-Time Operating System tasks on ARM targets.",
      instructor: "Priya Menon · Senior Alum & Mentor",
      enrolledCount: 18,
    },
    {
      id: "ai-edge-vision",
      title: "Edge Computer Vision & TensorRT Optimization",
      wing: "Software Wing",
      wingTone: "sky",
      dateRange: "Feb 05 – Mar 15, 2027",
      description:
        "Deploy lightweight neural networks on Jetson Nano and Raspberry Pi with hardware-accelerated video pipeline processing.",
      instructor: "Sanya Gupta · AI Lead",
      enrolledCount: 22,
    },
  ],
};

function WingPill({ wing, tone }: { wing: string; tone: "sky" | "green" | "yellow" | "red" }) {
  const tones = {
    sky: "border-sky-400/20 bg-sky-400/10 text-sky-400",
    green: "border-green-400/20 bg-green-400/10 text-green-400",
    yellow: "border-yellow-400/20 bg-yellow-400/10 text-yellow-300",
    red: "border-red-400/20 bg-red-400/10 text-red-400",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider ${tones[tone]}`}>
      {wing}
    </span>
  );
}

function WorkshopsHubPage() {
  const [activeTab, setActiveTab] = useState<Tab>("ongoing");

  const cards = MOCK_WORKSHOPS[activeTab];

  const tabLabels: { key: Tab; label: string; count: number }[] = [
    { key: "ongoing", label: "Ongoing", count: MOCK_WORKSHOPS.ongoing.length },
    { key: "upcoming", label: "Upcoming", count: MOCK_WORKSHOPS.upcoming.length },
    { key: "scheduled", label: "Scheduled", count: MOCK_WORKSHOPS.scheduled.length },
  ];

  return (
    <SiteShell>
      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        {/* Background ambient lighting */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 900px 500px at 50% 0%, rgba(59,130,246,0.10), transparent 70%)",
          }}
        />

        <main className="relative z-10 max-w-6xl mx-auto px-6 py-16">
          {/* Header */}
          <div className="max-w-3xl mb-12">
            <p className="text-xs font-mono tracking-widest text-sky-400 mb-3">/ WORKSHOPS HUB</p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              CREST Technical{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: "linear-gradient(90deg, #F97316, #FACC15, #22C55E, #38BDF8)",
                }}
              >
                Curriculum
              </span>
            </h1>
            <p className="text-white/50 text-base leading-relaxed">
              Hands-on engineering workshops designed and led by CREST wing leads. Master core programming, embedded electronics, and aerospace CAD.
            </p>
          </div>

          {/* Client-side Tabs */}
          <div className="inline-flex p-1 rounded-xl border border-white/10 bg-white/[0.02] mb-10 flex-wrap gap-1">
            {tabLabels.map((t) => {
              const active = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? "bg-sky-400 text-black shadow-md font-semibold"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span>{t.label}</span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-mono ${
                      active ? "bg-black/20 text-black" : "bg-white/10 text-white/60"
                    }`}
                  >
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Grid of Workshop Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((workshop) => (
              <div
                key={workshop.id}
                className="group relative rounded-2xl border border-white/10 bg-white/[0.02] p-6 flex flex-col justify-between hover:border-sky-400/40 transition-all duration-300 hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <WingPill wing={workshop.wing} tone={workshop.wingTone} />
                    <span className="flex items-center gap-1 text-[11px] font-mono text-white/40">
                      <Users className="w-3.5 h-3.5 text-sky-400" />
                      {workshop.enrolledCount} enrolled
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold leading-snug group-hover:text-sky-300 transition-colors">
                    {workshop.title}
                  </h3>

                  <p className="flex items-center gap-2 text-xs font-mono text-white/40 mt-2 mb-4">
                    <Calendar className="w-3.5 h-3.5 text-white/30" />
                    {workshop.dateRange}
                  </p>

                  <p className="text-sm text-white/60 leading-relaxed mb-6">
                    {workshop.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-white/45 font-mono truncate max-w-[170px]">
                    {workshop.instructor}
                  </span>

                  <Link
                    to="/workshops/detail"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-sky-400/30 bg-sky-400/10 px-3.5 py-1.5 text-xs font-medium text-sky-400 transition-all hover:bg-sky-400 hover:text-black"
                  >
                    View Details
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {cards.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center">
              <p className="text-white/40 text-sm">No workshops found in this category.</p>
            </div>
          )}
        </main>
      </div>
    </SiteShell>
  );
}
