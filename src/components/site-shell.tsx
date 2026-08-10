import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/wings", label: "Wings" },
  { to: "/events", label: "Events" },
  { to: "/achievements", label: "Achievements" },
  { to: "/apply", label: "Apply" },
  { to: "/login", label: "Login"}
];

export function CrestLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Stylized C in brand colors */}
      <path d="M24 6 L42 6 L42 16 L34 16 L34 12 L24 12 Z" fill="var(--brand-red)" />
      <path d="M24 6 L14 6 L6 14 L6 22 L14 22 L14 16 L20 16 L24 12 Z" fill="var(--brand-yellow)" />
      <path d="M6 22 L6 34 L14 42 L20 42 L20 36 L14 36 L14 26 L6 26 Z" fill="var(--brand-green)" />
      <path d="M14 42 L24 42 L34 42 L42 42 L42 32 L34 32 L34 36 L24 36 L20 42 Z" fill="var(--brand-blue)" />
    </svg>
  );
}

export function SiteHeader() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "backdrop-blur-xl bg-background/70 border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
        <Link to="/" className="flex items-center gap-2 group">
          <CrestLogo className="w-8 h-8 transition-transform duration-500 group-hover:rotate-12" />
          <span className="font-bold tracking-widest text-lg">
            <span className="text-gradient-brand">CREST</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((n) => {
            const active = path === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {n.label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-0.5 h-px bg-gradient-to-r from-brand-red via-brand-yellow to-brand-blue" />
                )}
              </Link>
            );
          })}
        </nav>

        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl animate-fade-in">
          <div className="px-4 py-3 flex flex-col gap-1">
            {NAV.concat({ to: "/admin", label: "Admin" }).map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-md text-sm text-foreground hover:bg-accent"
              >
                {n.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid gap-8 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <CrestLogo className="w-8 h-8" />
            <span className="font-bold tracking-widest">
              <span className="text-gradient-brand">CREST</span>
            </span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground max-w-md">
            Community for Robotics, Electronics, Software & Technology. A Tier-1 technical
            organization at LPU. Learn. Build. Compete.
          </p>
          <p className="mt-4 font-mono text-xs text-muted-foreground">
            LEARN · BUILD · COMPETE
          </p>
        </div>
        <div>
          <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
            Explore
          </h4>
          <ul className="space-y-2 text-sm">
            {NAV.map((n) => (
              <li key={n.to}>
                <Link to={n.to} className="hover:text-foreground text-muted-foreground">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
            Community
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Lovely Professional University</li>
            <li>Est. Student-Driven</li>
            <li>Tier 1 · Technical</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} CREST. All rights reserved.</span>
          <span className="font-mono">v2026.1 · TIER_1</span>
        </div>
      </div>
    </footer>
  );
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-topo">
      <SiteHeader />
      <main className="pt-16">{children}</main>
      <SiteFooter />
    </div>
  );
}
