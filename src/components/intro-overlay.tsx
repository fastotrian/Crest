import { useEffect, useState } from "react";
import { CrestLogo } from "./site-shell";

/**
 * Techy boot-sequence intro:
 * - CREST wordmark assembles letter-by-letter
 * - Morphs into the CREST crest logo
 * - Side HUD panels show scanning / loading / battery / recording / telemetry
 * - Auto-dismisses; also click-to-skip
 */
export function IntroOverlay() {
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0);
  const [progress, setProgress] = useState(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("crest-intro-seen")) return;
    setMounted(true);
    sessionStorage.setItem("crest-intro-seen", "1");

    const t1 = setTimeout(() => setPhase(1), 400);   // letters assembling
    const t2 = setTimeout(() => setPhase(2), 1900);  // morph to logo
    const t3 = setTimeout(() => setPhase(3), 3200);  // fade out
    const t4 = setTimeout(() => setHidden(true), 4000);

    const iv = setInterval(() => {
      setProgress((p) => (p >= 100 ? 100 : p + Math.random() * 9 + 3));
    }, 90);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
      clearInterval(iv);
    };
  }, []);

  if (!mounted || hidden) return null;

  const letters = ["C", "R", "E", "S", "T"];

  return (
    <div
      onClick={() => setHidden(true)}
      className={`fixed inset-0 z-[100] bg-black overflow-hidden cursor-pointer transition-opacity duration-700 ${
        phase === 3 ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute inset-0 bg-noise opacity-[0.12] mix-blend-overlay" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vmin] h-[70vmin] rounded-full bg-primary/10 blur-3xl animate-glow-pulse" />

      {/* corner brackets */}
      <Bracket className="top-4 left-4" corner="tl" />
      <Bracket className="top-4 right-4" corner="tr" />
      <Bracket className="bottom-4 left-4" corner="bl" />
      <Bracket className="bottom-4 right-4" corner="br" />

      {/* HUD panels */}
      <div className="absolute top-6 left-6 sm:top-10 sm:left-10 space-y-2 font-mono text-[10px] sm:text-xs">
        <HudLine label="SYS" value="CREST.OS v2026.1" />
        <HudLine label="NODE" value="LPU-TIER1" />
        <HudLine label="AUTH" value="GRANTED" ok />
        <div className="flex items-center gap-2 text-brand-red">
          <span className="w-2 h-2 rounded-full bg-brand-red animate-glow-pulse" />
          <span>REC</span>
          <span className="text-muted-foreground">00:00:{String(Math.min(99, Math.floor(progress))).padStart(2, "0")}</span>
        </div>
      </div>

      <div className="absolute top-6 right-6 sm:top-10 sm:right-10 space-y-2 font-mono text-[10px] sm:text-xs text-right">
        <HudLine label="LAT" value="31.25°N" align="right" />
        <HudLine label="LON" value="75.70°E" align="right" />
        <BatteryIndicator />
        <SignalBars />
      </div>

      <div className="absolute bottom-6 left-6 sm:bottom-10 sm:left-10 right-6 sm:right-10 font-mono text-[10px] sm:text-xs space-y-2">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>BOOT SEQUENCE</span>
          <span className="text-brand-green">{Math.min(100, Math.floor(progress))}%</span>
        </div>
        <div className="relative h-1 w-full bg-white/5 overflow-hidden rounded">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-red via-brand-yellow to-brand-blue transition-all duration-100"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
          <div className="absolute inset-0 animate-shimmer" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-muted-foreground pt-1">
          <BootLine text="mounting /wings ..." done={progress > 15} />
          <BootLine text="linking events.mod" done={progress > 40} />
          <BootLine text="scan integrity" done={progress > 65} />
          <BootLine text="ignition ready" done={progress > 92} />
        </div>
      </div>

      {/* horizontal scan sweep — subtle, not the previous ugly one */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-primary/10 to-transparent animate-scan-sweep" />
      </div>

      {/* CENTER STAGE — CREST -> LOGO */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-[min(80vmin,520px)] h-[min(80vmin,520px)] flex items-center justify-center">
          {/* rotating rings */}
          <div className={`absolute inset-0 rounded-full border border-primary/20 transition-opacity duration-700 ${phase >= 2 ? "opacity-100" : "opacity-40"}`} />
          <div className="absolute inset-4 rounded-full border border-brand-blue/20 animate-spin-slow" />
          <div className="absolute inset-10 rounded-full border border-dashed border-brand-yellow/20 animate-spin-slow" style={{ animationDirection: "reverse" }} />

          {/* wordmark */}
          <div
            className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${
              phase >= 2 ? "opacity-0 scale-125 blur-md" : "opacity-100 scale-100 blur-0"
            }`}
          >
            <div className="flex gap-1 sm:gap-2">
              {letters.map((l, i) => (
                <span
                  key={i}
                  className="text-6xl sm:text-8xl font-bold tracking-tight text-gradient-brand animate-gradient-x inline-block"
                  style={{
                    animation: `letter-drop 0.6s cubic-bezier(0.2,0.8,0.2,1) both`,
                    animationDelay: `${400 + i * 120}ms`,
                  }}
                >
                  {l}
                </span>
              ))}
            </div>
          </div>

          {/* logo reveal */}
          <div
            className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${
              phase >= 2 ? "opacity-100 scale-100" : "opacity-0 scale-50"
            }`}
          >
            <div className="relative">
              <CrestLogo className="w-40 h-40 sm:w-52 sm:h-52 animate-float-slow" />
              <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-brand-red/60 via-brand-yellow/40 to-brand-blue/60 -z-10 animate-glow-pulse" />
            </div>
          </div>

          {/* crosshair */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/2 top-0 -translate-x-1/2 w-px h-6 bg-primary/40" />
            <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-px h-6 bg-primary/40" />
            <div className="absolute top-1/2 left-0 -translate-y-1/2 h-px w-6 bg-primary/40" />
            <div className="absolute top-1/2 right-0 -translate-y-1/2 h-px w-6 bg-primary/40" />
          </div>
        </div>
      </div>

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-mono text-muted-foreground/60 tracking-widest">
        CLICK ANYWHERE TO SKIP
      </div>

      <style>{`
        @keyframes letter-drop {
          0% { opacity: 0; transform: translateY(-40px) rotateX(-90deg); filter: blur(8px); }
          60% { opacity: 1; filter: blur(0); }
          100% { opacity: 1; transform: translateY(0) rotateX(0); }
        }
        @keyframes scan-sweep {
          0% { transform: translateY(-20%); }
          100% { transform: translateY(120vh); }
        }
        .animate-scan-sweep { animation: scan-sweep 2.4s linear infinite; }
      `}</style>
    </div>
  );
}

function Bracket({ className = "", corner }: { className?: string; corner: "tl" | "tr" | "bl" | "br" }) {
  const border = {
    tl: "border-t-2 border-l-2",
    tr: "border-t-2 border-r-2",
    bl: "border-b-2 border-l-2",
    br: "border-b-2 border-r-2",
  }[corner];
  return <div className={`absolute w-6 h-6 border-primary/60 ${border} ${className}`} />;
}

function HudLine({ label, value, ok, align = "left" }: { label: string; value: string; ok?: boolean; align?: "left" | "right" }) {
  return (
    <div className={`flex items-center gap-2 ${align === "right" ? "justify-end" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className={ok ? "text-brand-green" : "text-foreground"}>{value}</span>
    </div>
  );
}

function BatteryIndicator() {
  return (
    <div className="flex items-center gap-2 justify-end">
      <span className="text-muted-foreground">PWR</span>
      <div className="flex items-center gap-0.5">
        <div className="w-8 h-3 border border-brand-green/70 rounded-sm p-0.5 flex gap-0.5">
          <div className="flex-1 bg-brand-green" />
          <div className="flex-1 bg-brand-green" />
          <div className="flex-1 bg-brand-green animate-flicker" />
        </div>
        <div className="w-0.5 h-1.5 bg-brand-green/70" />
      </div>
      <span className="text-brand-green">98%</span>
    </div>
  );
}

function SignalBars() {
  return (
    <div className="flex items-center gap-2 justify-end">
      <span className="text-muted-foreground">SIG</span>
      <div className="flex items-end gap-0.5">
        {[3, 5, 7, 9].map((h, i) => (
          <div
            key={i}
            className="w-1 bg-brand-blue animate-flicker"
            style={{ height: `${h}px`, animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function BootLine({ text, done }: { text: string; done: boolean }) {
  return (
    <div className="flex items-center gap-1.5 truncate">
      <span className={done ? "text-brand-green" : "text-muted-foreground/50"}>
        {done ? "✓" : "›"}
      </span>
      <span className={done ? "text-foreground/80" : "text-muted-foreground/50"}>{text}</span>
    </div>
  );
}
