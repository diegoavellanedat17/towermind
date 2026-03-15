"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface Stats {
  totalConversations: number;
  successfulCount: number;
  totalDuration: number;
  avgDuration: number;
  totalMessages: number;
}

interface TimelineEntry {
  id: string;
  time: number;
  duration: number;
  summary: string;
  messageCount: number;
  userQuestions: string[];
}

interface InsightsData {
  stats: Stats;
  floorMentions: Record<string, number>;
  summaries: string[];
  timeline: TimelineEntry[];
  userMessages: string[];
}

function formatTime(unix: number): string {
  if (!unix || isNaN(unix)) return "Recent";
  const d = new Date(unix * 1000);
  if (isNaN(d.getTime())) return "Recent";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatDuration(secs: number): string {
  if (!secs || isNaN(secs) || secs <= 0) return "< 1s";
  if (secs < 60) return `${Math.round(secs)}s`;
  return `${Math.floor(secs / 60)}m ${Math.round(secs % 60)}s`;
}

const FLOOR_COLORS: Record<string, string> = {
  "Floor 2": "var(--violet)", "Floor 3": "var(--blue)", "Floor 4": "var(--cyan)",
  "Floor 6": "var(--rose)", "Floor 7": "var(--amber)", "Floor 8": "var(--emerald)",
  "Floor 9": "var(--violet)", "Floor 11": "var(--blue)", "Floor 12": "var(--cyan)",
  "Floor 14": "var(--emerald)",
};

function getFloorColor(floor: string): string {
  for (const [key, color] of Object.entries(FLOOR_COLORS)) {
    if (floor.includes(key)) return color;
  }
  return "var(--violet)";
}

export default function Dashboard() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/insights");
      if (!res.ok) throw new Error("API error");
      const json = await res.json();
      setData(json);
      setLastUpdate(new Date());
      setError("");
    } catch {
      setError("Failed to load insights");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="noise flex h-svh items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="orb-container" style={{ width: 80, height: 80 }}>
            <div className="orb-core" style={{ width: 40, height: 40 }} />
          </div>
          <p className="font-[var(--font-mono)]" style={{ fontSize: 11, color: "var(--text-4)", letterSpacing: "0.2em" }}>
            LOADING INTELLIGENCE...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="noise flex h-svh flex-col items-center justify-center gap-4">
        <p style={{ fontSize: 14, color: "var(--rose)" }}>{error}</p>
        <button onClick={fetchData} className="btn-ghost">Retry</button>
      </div>
    );
  }

  const sortedFloors = Object.entries(data.floorMentions).sort(([, a], [, b]) => b - a);
  const maxMentions = sortedFloors.length > 0 ? sortedFloors[0][1] : 1;
  const successRate = data.stats.totalConversations > 0
    ? Math.round((data.stats.successfulCount / data.stats.totalConversations) * 100) : 0;

  const stats = [
    { value: String(data.stats.totalConversations), label: "CONVERSATIONS", sub: `${successRate}% success`, gradient: true },
    { value: formatDuration(data.stats.totalDuration), label: "TALK TIME", sub: "cumulative", gradient: false },
    { value: `${data.stats.avgDuration || 0}s`, label: "AVG DURATION", sub: "per session", gradient: false },
    { value: String(data.stats.totalMessages), label: "MESSAGES", sub: "exchanged", gradient: false },
    { value: String(data.userMessages.length), label: "QUESTIONS", sub: "from visitors", gradient: false },
  ];

  return (
    <div className="noise grid-bg relative min-h-svh flex flex-col">
      <div className="scan-line" />

      {/* NAV */}
      <nav className="nav-glass sticky top-0 z-30 flex items-center justify-between px-5 py-3 md:px-8">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="font-[var(--font-mono)]"
            style={{ fontSize: 13, color: "var(--text-3)", textDecoration: "none", letterSpacing: "0.06em", transition: "color 0.15s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--violet-light)"; e.currentTarget.style.textDecoration = "underline"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-3)"; e.currentTarget.style.textDecoration = "none"; }}
          >
            ← TowerMind
          </Link>
          <span style={{ color: "var(--text-4)" }}>/</span>
          <span className="font-[var(--font-mono)]" style={{ fontSize: 11, color: "var(--text-4)", letterSpacing: "0.2em" }}>INSIGHTS</span>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="font-[var(--font-mono)] hidden md:block" style={{ fontSize: 11, color: "var(--text-4)" }}>
              {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <div className="flex items-center gap-2">
            <div className="status-dot" />
            <span className="font-[var(--font-mono)]" style={{ fontSize: 11, color: "var(--emerald-light)", letterSpacing: "0.14em" }}>LIVE</span>
          </div>
          <button onClick={fetchData} className="btn-ghost">Refresh</button>
        </div>
      </nav>

      {/* CONTENT */}
      <main className="relative z-10 mx-auto w-full max-w-[920px] flex-1 px-5 md:px-8" style={{ paddingTop: 64, paddingBottom: 0 }}>

        {/* HEADER */}
        <div className="anim-location">
          <p className="font-[var(--font-mono)]" style={{ fontSize: 11, color: "var(--text-4)", letterSpacing: "0.2em", marginBottom: 24 }}>
            REAL-TIME ANALYTICS · FRONTIER TOWER
          </p>
          <h1
            className="font-[var(--font-ui)]"
            style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 300, color: "var(--text-1)", lineHeight: 1.1 }}
          >
            Conversation Intelligence
          </h1>
          <p className="font-[var(--font-ui)]" style={{ fontSize: 16, color: "var(--text-2)", lineHeight: 1.7, marginTop: 16, maxWidth: 520 }}>
            Live insights from TowerMind voice sessions — floor interest, visitor questions, and AI analysis.
          </p>
        </div>

        {/* STATS BAR */}
        <div
          className="stats-bar anim-name"
          style={{
            marginTop: 64,
            display: "flex",
            flexDirection: "row",
            borderTop: "1px solid var(--border-dim)",
            borderBottom: "1px solid var(--border-dim)",
          }}
        >
          {stats.map((stat, i, arr) => (
            <div
              key={stat.label}
              style={{
                flex: 1,
                padding: "32px 0 32px 24px",
                borderRight: i < arr.length - 1 ? "1px solid var(--border-dim)" : "none",
              }}
            >
              <p
                className="font-[var(--font-ui)]"
                style={{
                  fontSize: "clamp(24px, 4vw, 40px)",
                  fontWeight: 300,
                  lineHeight: 1,
                  ...(stat.gradient
                    ? {
                        background: "linear-gradient(135deg, var(--violet-light), var(--cyan-light))",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }
                    : { color: "var(--text-1)" }),
                }}
              >
                {stat.value}
              </p>
              <p className="font-[var(--font-mono)]" style={{ fontSize: 10, color: "var(--text-4)", letterSpacing: "0.18em", marginTop: 8 }}>
                {stat.label}
              </p>
              <p className="font-[var(--font-mono)]" style={{ fontSize: 10, color: "var(--text-4)", marginTop: 4 }}>
                {stat.sub}
              </p>
            </div>
          ))}
        </div>

        {/* AI ANALYSIS */}
        {data.summaries.length > 0 && (
          <section className="anim-tagline" style={{ marginTop: 64 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span className="font-[var(--font-mono)]" style={{ fontSize: 11, color: "var(--text-4)", letterSpacing: "0.2em" }}>
                AI ANALYSIS
              </span>
              <span className="font-[var(--font-mono)]" style={{ fontSize: 9, letterSpacing: "0.14em", borderRadius: 4, padding: "3px 8px", background: "var(--amber-dim)", color: "var(--amber-light)" }}>
                AUTO
              </span>
            </div>
            <div style={{ height: 1, background: "var(--border-dim)", marginBottom: 24 }} />
            <div className="columns-1 gap-10 md:columns-2">
              {data.summaries.map((s, i) => (
                <div key={i} className="mb-6 flex break-inside-avoid gap-4">
                  <div style={{ width: 3, flexShrink: 0, alignSelf: "stretch", borderRadius: 2, background: "linear-gradient(180deg, var(--violet), var(--cyan), transparent)" }} />
                  <p className="font-[var(--font-ui)]" style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text-2)" }}>{s}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TWO COLUMN GRID */}
        <div className="anim-subtitle grid gap-0 lg:grid-cols-2" style={{ marginTop: 64, borderTop: "1px solid var(--border-dim)" }}>

          {/* FLOOR INTEREST */}
          <div style={{ padding: "32px 32px 32px 0", borderRight: "1px solid var(--border-dim)" }} className="floor-interest-col">
            <span className="font-[var(--font-mono)]" style={{ fontSize: 11, color: "var(--text-4)", letterSpacing: "0.2em" }}>
              FLOOR INTEREST
            </span>
            {sortedFloors.length === 0 ? (
              <p className="font-[var(--font-mono)]" style={{ fontSize: 11, color: "var(--text-4)", marginTop: 32, textAlign: "center" }}>
                NO MENTIONS YET
              </p>
            ) : (
              <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 20 }}>
                {sortedFloors.map(([floor, count], idx) => {
                  const color = getFloorColor(floor);
                  return (
                    <div key={floor}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                        <span className="font-[var(--font-ui)]" style={{ fontSize: 14, fontWeight: 500, color: "var(--text-1)" }}>{floor}</span>
                        <span className="font-[var(--font-mono)]" style={{ fontSize: 13, fontWeight: 700, color }}>{count}</span>
                      </div>
                      <div className="progress-bar">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(count / maxMentions) * 100}%` }}
                          transition={{ duration: 0.8, delay: 0.2 + idx * 0.1, ease: [0.16, 1, 0.3, 1] as const }}
                          className="progress-fill"
                          style={{
                            background: `linear-gradient(90deg, ${color}, color-mix(in srgb, ${color} 60%, white))`,
                            boxShadow: `0 0 12px color-mix(in srgb, ${color} 25%, transparent)`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* VISITOR QUESTIONS */}
          <div style={{ padding: "32px 0 32px 32px" }} className="questions-col">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="font-[var(--font-mono)]" style={{ fontSize: 11, color: "var(--text-4)", letterSpacing: "0.2em" }}>
                VISITOR QUESTIONS
              </span>
              <span className="font-[var(--font-mono)]" style={{ fontSize: 9, letterSpacing: "0.14em", borderRadius: 4, padding: "3px 8px", background: "var(--cyan-dim)", color: "var(--cyan-light)" }}>
                {data.userMessages.length}
              </span>
            </div>
            <div style={{ marginTop: 24, maxHeight: 420, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {data.userMessages.length === 0 ? (
                <p className="font-[var(--font-mono)]" style={{ fontSize: 11, color: "var(--text-4)", marginTop: 32, textAlign: "center" }}>
                  NO QUESTIONS YET
                </p>
              ) : (
                data.userMessages.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "12px 16px",
                      borderRadius: 8,
                      border: "1px solid var(--border-dim)",
                      background: "var(--surface-0)",
                      fontSize: 13,
                      lineHeight: 1.6,
                      color: "var(--text-2)",
                      transition: "border-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-mid)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-dim)"; }}
                  >
                    <span style={{ color: "var(--cyan-light)", marginRight: 8 }}>&rsaquo;</span>{msg}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* CONVERSATION FEED */}
        <section className="anim-speak" style={{ marginTop: 64 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <span className="font-[var(--font-mono)]" style={{ fontSize: 11, color: "var(--text-4)", letterSpacing: "0.2em" }}>
              CONVERSATION FEED
            </span>
            <span className="font-[var(--font-mono)]" style={{ fontSize: 9, letterSpacing: "0.14em", borderRadius: 4, padding: "3px 8px", background: "var(--emerald-dim)", color: "var(--emerald-light)" }}>
              {data.timeline.length} SESSIONS
            </span>
          </div>
          <div style={{ height: 1, background: "var(--border-dim)", marginBottom: 24 }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {data.timeline.length === 0 ? (
              <div style={{ padding: "64px 0", textAlign: "center" }}>
                <p className="font-[var(--font-ui)]" style={{ fontSize: 14, color: "var(--text-3)" }}>No conversations yet</p>
                <p className="font-[var(--font-mono)]" style={{ fontSize: 11, color: "var(--text-4)", marginTop: 8, letterSpacing: "0.1em" }}>WAITING FOR VISITORS</p>
              </div>
            ) : (
              data.timeline.map((conv) => (
                <div
                  key={conv.id}
                  className="conv-item"
                  onClick={() => setSelectedConv(selectedConv === conv.id ? null : conv.id)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "linear-gradient(135deg, var(--violet), var(--cyan))" }} />
                      <span className="font-[var(--font-mono)]" style={{ fontSize: 12, fontWeight: 700, color: "var(--text-1)" }}>
                        {formatTime(conv.time)}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <span className="font-[var(--font-mono)]" style={{ fontSize: 9, letterSpacing: "0.14em", borderRadius: 4, padding: "3px 8px", background: "var(--violet-dim)", color: "var(--violet-light)" }}>
                        {formatDuration(conv.duration)}
                      </span>
                      <span className="font-[var(--font-mono)]" style={{ fontSize: 9, letterSpacing: "0.14em", borderRadius: 4, padding: "3px 8px", background: "var(--cyan-dim)", color: "var(--cyan-light)" }}>
                        {conv.messageCount} MSGS
                      </span>
                    </div>
                  </div>
                  <p className="font-[var(--font-ui)]" style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text-2)" }}>
                    {conv.summary}
                  </p>
                  <AnimatePresence>
                    {selectedConv === conv.id && conv.userQuestions.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border-dim)", display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {conv.userQuestions.map((q, i) => (
                            <span key={i} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border-dim)", background: "var(--surface-1)", fontSize: 12, lineHeight: 1.5, color: "var(--text-2)" }}>
                              {q.length > 70 ? q.slice(0, 70) + "..." : q}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer
        className="w-full max-w-[920px] mx-auto"
        style={{
          marginTop: 64,
          borderTop: "1px solid var(--border-dim)",
          padding: "28px 20px 64px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <span className="font-[var(--font-mono)]" style={{ fontSize: 11, color: "var(--text-4)", letterSpacing: "0.18em" }}>
          <span style={{ animation: "pulse-dot 2.4s ease-in-out infinite", display: "inline-block", color: "var(--emerald-light)", marginRight: 8 }}>●</span>
          TOWERMIND INSIGHTS
        </span>
        <span className="font-[var(--font-mono)]" style={{ fontSize: 11, color: "var(--text-4)", letterSpacing: "0.1em" }}>
          ELEVENLABS × CLAUDE SONNET 4.6
        </span>
      </footer>
    </div>
  );
}
