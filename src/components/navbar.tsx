import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, ChevronDown, LogOut, User } from "lucide-react";

// =========================================================
// TYPES
// =========================================================

type DashboardTab = "overview" | "growth" | "community";

interface DashboardNavProps {
  active: DashboardTab;
}

const TABS: { key: DashboardTab; label: string; to: string }[] = [
  { key: "overview", label: "Overview", to: "/dashboard" },
  { key: "growth", label: "Growth", to: "/growth" },
  { key: "community", label: "Community", to: "/community" },
];

// =========================================================
// MOCK NOTIFICATION COUNT
// (replace with real unread count from your backend)
// =========================================================

const MOCK_UNREAD = 3;

export function DashboardNav({ active }: DashboardNavProps) {
  const navigate = useNavigate();

  const [name, setName] = useState("Member");
  const [wing, setWing] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    const storedWing = localStorage.getItem("userWing");

    if (storedName) setName(storedName);
    if (storedWing) setWing(storedWing);
  }, []);

  function logout() {
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("userWing");
    localStorage.removeItem("userRole");

    navigate({ to: "/login" });
  }

  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="sticky top-0 z-20 border-b border-white/10 bg-black/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Tabs */}
        <nav className="flex items-center gap-1">
          {TABS.map((tab) => {
            const isActive = tab.key === active;
            return (
              <Link
                key={tab.key}
                to={tab.to}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "text-white bg-white/5"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {tab.label}
                {isActive && (
                  <span
                    className="absolute left-4 right-4 -bottom-[1px] h-[2px] rounded-full"
                    style={{
                      backgroundImage:
                        "linear-gradient(90deg, #F97316, #FACC15, #22C55E, #38BDF8)",
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right side: notifications + user */}
        <div className="flex items-center gap-3">
          <button
            aria-label="Notifications"
            className="relative p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {MOCK_UNREAD > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-sky-400" />
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg border border-white/10 bg-white/[0.02] hover:border-white/20 transition-colors"
            >
              <span className="w-7 h-7 rounded-full bg-sky-400/10 border border-sky-400/30 flex items-center justify-center text-[11px] font-mono text-sky-400">
                {initials || <User className="w-3.5 h-3.5" />}
              </span>
              <span className="text-left leading-tight hidden sm:block">
                <span className="block text-xs text-white">{name}</span>
                {wing && (
                  <span className="block text-[10px] text-white/40 font-mono uppercase tracking-wide">
                    {wing}
                  </span>
                )}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-white/30" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-40 rounded-lg border border-white/10 bg-black shadow-xl overflow-hidden">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
