import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import Editor from "@monaco-editor/react";
import { SiteShell } from "@/components/site-shell";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Code2,
  FileCode2,
  Info,
  Loader2,
  Play,
  Terminal,
  User,
} from "lucide-react";

export const Route = createFileRoute("/workshops/detail")({
  head: () => ({
    meta: [
      { title: "Python Workshop: Autonomous Systems · CREST" },
      {
        name: "description",
        content:
          "Workshop curriculum, assignments, and interactive code editor for Python Autonomous & Embedded Systems.",
      },
    ],
  }),
  component: WorkshopDetailPage,
});

type Language = "python" | "c" | "javascript";

const STARTER_CODES: Record<Language, string> = {
  python: `# Python 3 - CREST Workshop Starter
def main():
    print("Output: Hello, CREST!")
    for i in range(1, 4):
        print(f"Session {i}: System initialized successfully")

if __name__ == "__main__":
    main()
`,
  c: `// C Language - CREST Firmware Starter
#include <stdio.h>

int main() {
    printf("Output: Hello, CREST!\\n");
    for (int i = 1; i <= 3; i++) {
        printf("Sensor %d status: OK\\n", i);
    }
    return 0;
}
`,
  javascript: `// JavaScript (Node.js) - CREST Scripting Starter
function runSystem() {
    console.log("Output: Hello, CREST!");
    const modules = ["Telemetry", "Control Loop", "Actuators"];
    modules.forEach((mod, idx) => {
        console.log(\`[MOD \${idx + 1}] \${mod} online\`);
    });
}

runSystem();
`,
};

const PISTON_LANGUAGES: Record<Language, string> = {
  python: "python",
  c: "c",
  javascript: "javascript",
};

const CURRICULUM = [
  { session: "Session 1", title: "Intro to Python & Environment Setup", date: "Aug 20, 2026" },
  { session: "Session 2", title: "Data Structures, Logic & Control Flow", date: "Aug 27, 2026" },
  { session: "Session 3", title: "Functions, Modules & Package Management", date: "Sep 03, 2026" },
  { session: "Session 4", title: "Object-Oriented Programming & File I/O", date: "Sep 10, 2026" },
  { session: "Session 5", title: "Integrating Python with Sensors & Serial APIs", date: "Sep 17, 2026" },
  { session: "Session 6", title: "Capstone Project: Autonomous Robot Controller", date: "Oct 15, 2026" },
];

function WorkshopDetailPage() {
  const [isEnrolled, setIsEnrolled] = useState(false);

  // Assignment Code Editor State
  const [language, setLanguage] = useState<Language>("python");
  const [code, setCode] = useState<string>(STARTER_CODES.python);
  const [output, setOutput] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<string>("");
  const [isEditorExpanded, setIsEditorExpanded] = useState(true);

  function handleLanguageChange(newLang: Language) {
    setLanguage(newLang);
    setCode(STARTER_CODES[newLang]);
    setOutput("");
    setExecutionError("");
  }

  async function executeCode() {
    setIsExecuting(true);
    setOutput("");
    setExecutionError("");

    try {
      const response = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language: PISTON_LANGUAGES[language],
          version: "*",
          files: [
            {
              content: code,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Piston API returned HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.run) {
        const stdout = data.run.stdout || "";
        const stderr = data.run.stderr || "";
        const resultText = (stdout + (stderr ? `\n--- Errors ---\n${stderr}` : "")).trim();
        setOutput(resultText || "(Execution completed with no output)");
      } else {
        throw new Error("Invalid execution response format.");
      }
    } catch (err) {
      setExecutionError(
        err instanceof Error ? err.message : "Failed to connect to code execution engine."
      );
    } finally {
      setIsExecuting(false);
    }
  }

  return (
    <SiteShell>
      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        {/* Background ambient gradient */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 900px 500px at 50% 0%, rgba(59,130,246,0.10), transparent 70%)",
          }}
        />

        <main className="relative z-10 max-w-5xl mx-auto px-6 py-12">
          {/* Back Button */}
          <Link
            to="/workshops"
            className="inline-flex items-center gap-2 text-xs font-mono text-white/50 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Workshops Hub
          </Link>

          {/* Workshop Header Card */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8 mb-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <span className="inline-flex items-center rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-mono uppercase tracking-wider text-sky-400">
                Software Wing
              </span>

              <div className="flex items-center gap-4 text-xs font-mono text-white/40">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-400" />
                  Aug 20 – Oct 17, 2026
                </span>
                <span>·</span>
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-sky-400" />
                  Aarav Sharma
                </span>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Python Workshop: Autonomous & Embedded Systems
            </h1>

            <p className="text-white/60 leading-relaxed text-sm md:text-base max-w-3xl mb-8">
              A 6-week practical workshop building pythonic controllers for autonomous robotics, sensor telemetry parsing, and multi-threaded system interfaces. Designed specifically for CREST engineers preparing for inter-university robot competitions.
            </p>

            {/* Enroll Action */}
            <div className="flex items-center gap-4 pt-4 border-t border-white/10">
              <button
                onClick={() => setIsEnrolled(true)}
                className={`inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-all ${
                  isEnrolled
                    ? "bg-green-500/20 border border-green-500/40 text-green-400 cursor-default"
                    : "bg-sky-500 hover:bg-sky-400 text-black hover:scale-[1.02]"
                }`}
              >
                {isEnrolled ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Enrolled!
                  </>
                ) : (
                  "Enroll in Workshop"
                )}
              </button>

              <span className="text-xs font-mono text-white/40">
                {isEnrolled ? "You're confirmed for all 6 sessions" : "24 members enrolled"}
              </span>
            </div>
          </div>

          {/* Curriculum Section */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8 mb-8">
            <p className="text-xs font-mono tracking-widest text-sky-400 mb-2">/ SYLLABUS</p>
            <h2 className="text-xl font-bold mb-6">Curriculum Sessions</h2>

            <div className="space-y-3 mb-8">
              {CURRICULUM.map((item, idx) => (
                <div
                  key={item.session}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-white/10 bg-black/40 gap-2 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-sky-400/10 border border-sky-400/20 flex items-center justify-center text-xs font-mono text-sky-400 font-semibold shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-mono text-sky-400/80">{item.session}</p>
                      <p className="text-sm font-medium text-white">{item.title}</p>
                    </div>
                  </div>

                  <span className="text-xs font-mono text-white/40 self-end sm:self-center">
                    {item.date}
                  </span>
                </div>
              ))}
            </div>

            {/* Prerequisites */}
            <div className="rounded-xl border border-white/10 bg-black/30 p-4 flex items-start gap-3">
              <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-sky-400 mb-1">
                  PREREQUISITES
                </p>
                <p className="text-xs text-white/60 leading-relaxed">
                  Basic understanding of computers and programming logic. Laptop with Python 3.10+ installed (VS Code recommended). Prior experience in C or Arduino is helpful but not required.
                </p>
              </div>
            </div>
          </div>

          {/* Assignments Section */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
            <p className="text-xs font-mono tracking-widest text-sky-400 mb-2">/ PRACTICE</p>
            <h2 className="text-xl font-bold mb-6">Workshop Assignments</h2>

            <div className="space-y-6">
              {/* Assignment 1: Standard card */}
              <div className="rounded-xl border border-white/10 bg-black/40 p-5">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-yellow-400 border border-yellow-400/20 bg-yellow-400/10 px-2 py-0.5 rounded-full">
                      Assignment 1
                    </span>
                    <h3 className="text-base font-semibold text-white mt-2">
                      Sensor Telemetry Data Parser
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-white/40">Due: Aug 28, 2026</span>
                </div>
                <p className="text-xs text-white/50 leading-relaxed">
                  Write a function that reads a raw string stream of sensor values, extracts temperature and voltage numbers, and filters out invalid packet headers.
                </p>
              </div>

              {/* Assignment 2: Interactive Monaco Code Editor Card */}
              <div className="rounded-xl border border-sky-400/30 bg-black/50 overflow-hidden">
                <div className="p-5 border-b border-white/10">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 border border-sky-400/20 bg-sky-400/10 px-2 py-0.5 rounded-full">
                        Assignment 2 · Interactive Playground
                      </span>
                      <h3 className="text-base font-semibold text-white mt-2">
                        Control Loop Signal Formatter
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-white/40">Due: Sep 04, 2026</span>
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed mb-4">
                    Implement the main control loop formatting script. Test your code directly below using the embedded Monaco Editor and live Piston engine compiler.
                  </p>

                  <button
                    onClick={() => setIsEditorExpanded((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-sky-400 hover:text-sky-300"
                  >
                    <FileCode2 className="w-3.5 h-3.5" />
                    {isEditorExpanded ? "Collapse Editor" : "Expand Editor"}
                    {isEditorExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {isEditorExpanded && (
                  <div className="p-4 space-y-4 bg-black/60">
                    {/* Controls Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-white/[0.03] p-3 rounded-lg border border-white/10">
                      <div className="flex items-center gap-3">
                        <label htmlFor="language-select" className="text-xs font-mono text-white/40">LANGUAGE:</label>
                        <select
                          id="language-select"
                          aria-label="Select Programming Language"
                          value={language}
                          onChange={(e) => handleLanguageChange(e.target.value as Language)}
                          className="bg-black border border-white/20 rounded px-3 py-1.5 text-xs font-mono text-sky-400 focus:outline-none focus:border-sky-400"
                        >
                          <option value="python">Python 3</option>
                          <option value="c">C Language</option>
                          <option value="javascript">JavaScript (Node)</option>
                        </select>
                      </div>

                      <button
                        onClick={executeCode}
                        disabled={isExecuting}
                        className="inline-flex items-center gap-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-black px-4 py-1.5 text-xs font-semibold disabled:opacity-50 transition-all"
                      >
                        {isExecuting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Executing...
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            Run Code
                          </>
                        )}
                      </button>
                    </div>

                    {/* Monaco Editor Container */}
                    <div className="rounded-lg border border-white/10 overflow-hidden bg-[#1e1e1e]">
                      <Editor
                        height="260px"
                        language={language}
                        theme="vs-dark"
                        value={code}
                        onChange={(val) => setCode(val || "")}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 13,
                          fontFamily: "JetBrains Mono, monospace",
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          padding: { top: 12, bottom: 12 },
                        }}
                      />
                    </div>

                    {/* Output Panel */}
                    <div className="rounded-lg border border-white/10 bg-black/80 overflow-hidden">
                      <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between text-xs font-mono text-white/50 bg-white/[0.02]">
                        <span className="flex items-center gap-2">
                          <Terminal className="w-3.5 h-3.5 text-sky-400" />
                          Output Panel
                        </span>
                        {isExecuting && <span className="text-yellow-400 text-[11px]">Executing via Piston API...</span>}
                      </div>

                      <div className="p-4 font-mono text-xs min-h-[90px] whitespace-pre-wrap leading-relaxed">
                        {executionError && (
                          <div className="text-red-400 bg-red-400/10 border border-red-400/20 p-3 rounded">
                            Execution Error: {executionError}
                          </div>
                        )}
                        {!executionError && output && (
                          <div className="text-green-300">{output}</div>
                        )}
                        {!executionError && !output && !isExecuting && (
                          <span className="text-white/30 italic">
                            Click "Run Code" to execute code via Piston API...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </SiteShell>
  );
}
