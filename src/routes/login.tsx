import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";

import { SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/login")({
  component: Login,
});

const API_URL = "https://crest-jvfj.onrender.com";

// =========================================================
// TOKEN HELPERS
// =========================================================
// FIX: localStorage.setItem("accessToken", data.token) will
// happily store the *string* "null" or "undefined" if the
// backend response is malformed. That string is truthy, so
// every later authFetch() call would send
// "Authorization: Bearer null" and silently 401. This helper
// makes sure we only ever persist a real token, and refuses
// to proceed (with a visible error) otherwise.

function normalizeToken(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") return "";
  return trimmed;
}

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function checkLogin() {
    setLoading(true);
    setMessage("");
    setSuccess(false);

    try {
      const response = await fetch(
        `${API_URL}/logincheck`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
          }),
        }
      );

      const data = await response.json();

      console.log("Login response:", data);

      // ================================================
      // LOGIN FAILED
      // ================================================

      if (!response.ok || !data.success) {
        setSuccess(false);
        setMessage(
          data.message || "Login failed"
        );
        return;
      }

      // ================================================
      // MAKE SURE JWT EXISTS AND IS VALID
      // ================================================
      // FIX: validate the token itself, not just its presence.
      // A malformed response like { token: null } or
      // { token: "null" } used to sail straight through.

      const token = normalizeToken(data.token);

      if (!token) {
        console.error(
          "Login response missing a valid token:",
          data
        );

        setSuccess(false);
        setMessage(
          "Login succeeded but authentication token was not received. Please try again, or contact an admin if this keeps happening."
        );
        return;
      }

      // ================================================
      // ADMIN LOGIN
      // ================================================

      if (data.role === "admin") {
        localStorage.setItem(
          "accessToken",
          token
        );

        localStorage.setItem(
          "userEmail",
          data.email
        );

        localStorage.setItem(
          "userRole",
          "admin"
        );

        // Remove member-specific data
        localStorage.removeItem("userName");
        localStorage.removeItem("userWing");

        setSuccess(true);
        setMessage("Admin login successful");

        setTimeout(() => {
          navigate({
            to: "/admin",
            replace: true,
          });
        }, 500);

        return;
      }

      // ================================================
      // MEMBER LOGIN
      // ================================================

      if (data.role === "member") {
        localStorage.setItem(
          "accessToken",
          token
        );

        localStorage.setItem(
          "userEmail",
          data.email
        );

        localStorage.setItem(
          "userName",
          data.name || "Member"
        );

        localStorage.setItem(
          "userWing",
          data.wing || ""
        );

        localStorage.setItem(
          "userRole",
          "member"
        );

        setSuccess(true);

        setMessage(
          `Welcome ${data.name || "Member"}!`
        );

        setTimeout(() => {
          navigate({
            to: "/dashboard",
            replace: true,
          });
        }, 500);

        return;
      }

      // ================================================
      // UNKNOWN ROLE
      // ================================================

      setSuccess(false);
      setMessage("Invalid user role.");

    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      setSuccess(false);

      setMessage(
        "Unable to connect to server"
      );

    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(
    e: FormEvent
  ) {
    e.preventDefault();

    if (loading) {
      return;
    }

    checkLogin();
  }

  return (
    <SiteShell>
      <div className="min-h-screen bg-black text-white relative overflow-hidden">

        {/* Background */}

        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 900px 500px at 50% 0%, rgba(59,130,246,0.10), transparent 70%)",
          }}
        />

        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(255,255,255,0.4) 0px, transparent 1px, transparent 2px)",
            backgroundSize: "100% 3px",
            mixBlendMode: "overlay",
          }}
        />

        {/* Login */}

        <main className="relative z-10 flex flex-col items-center px-6 pt-20 pb-24">

          <div className="w-full max-w-md">

            <p className="text-xs font-mono tracking-widest text-sky-400 mb-4">
              / LOGIN
            </p>

            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
              Welcome{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, #F97316, #FACC15, #22C55E, #38BDF8)",
                }}
              >
                back
              </span>
            </h1>

            <p className="text-white/50 mb-10 leading-relaxed">
              Sign in to access your CREST dashboard,
              projects and wing resources.
            </p>

            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8 space-y-5"
            >

              {/* EMAIL */}

              <div>

                <label
                  htmlFor="email"
                  className="block text-xs font-mono tracking-widest text-white/40 mb-2"
                >
                  EMAIL
                </label>

                <div className="relative">

                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30"
                  />

                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="you@lpu.in"
                    className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-sky-400/50 focus:ring-1 focus:ring-sky-400/30 transition-colors"
                  />

                </div>

              </div>

              {/* PASSWORD */}

              <div>

                <div className="flex items-center justify-between mb-2">

                  <label
                    htmlFor="password"
                    className="block text-xs font-mono tracking-widest text-white/40"
                  >
                    PASSWORD
                  </label>

                  <span className="text-xs text-white/40">
                    CREST
                  </span>

                </div>

                <div className="relative">

                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30"
                  />

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="••••••••"
                    className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-10 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-sky-400/50 focus:ring-1 focus:ring-sky-400/30 transition-colors"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (value) => !value
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>

                </div>

              </div>

              {/* MESSAGE */}

              {message && (
                <div
                  className={`text-sm text-center rounded-lg px-3 py-2 border ${
                    success
                      ? "text-green-400 bg-green-400/10 border-green-400/20"
                      : "text-red-400 bg-red-400/10 border-red-400/20"
                  }`}
                >
                  {message}
                </div>
              )}

              {/* LOGIN BUTTON */}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-60 disabled:cursor-not-allowed text-black font-semibold text-sm rounded-lg py-3 transition-colors"
              >
                {loading
                  ? "Signing in..."
                  : "Log in"}

                {!loading && (
                  <ArrowRight className="w-4 h-4" />
                )}
              </button>

              {/* OR */}

              <div className="flex items-center gap-3 pt-1">

                <div className="h-px flex-1 bg-white/10" />

                <span className="text-[11px] text-white/30 font-mono">
                  OR
                </span>

                <div className="h-px flex-1 bg-white/10" />

              </div>

              {/* APPLY */}

              <p className="text-center text-sm text-white/40">

                New to CREST?{" "}

                <a
                  href="/apply"
                  className="text-white font-medium hover:text-sky-400 transition-colors"
                >
                  Apply now
                </a>

              </p>

            </form>

            <p className="text-center text-[11px] text-white/25 mt-8 font-mono tracking-widest">
              TIER 1 · TECHNICAL · LPU
            </p>

          </div>

        </main>

      </div>
    </SiteShell>
  );
}