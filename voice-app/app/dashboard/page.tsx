"use client";

import { useState, useEffect, useCallback } from "react";
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
  return new Date(unix * 1000).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDuration(secs: number): string {
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

export default function Dashboard() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

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
      <div className="bg-cockpit flex h-screen items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="pulse-dot" />
          <p className="label">Loading intelligence...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-cockpit flex h-screen items-center justify-center">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  const sortedFloors = Object.entries(data.floorMentions).sort(
    ([, a], [, b]) => b - a
  );
  const maxMentions = sortedFloors.length > 0 ? sortedFloors[0][1] : 1;

  return (
    <div className="bg-cockpit grid-pattern relative min-h-screen overflow-auto">
      <div className="scan-line" />

      {/* Top bar */}
      <nav className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--border)] bg-black/80 px-6 py-3 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-lg font-bold">
            Tower<span className="text-[var(--accent)]">Mind</span>
          </Link>
          <span className="label label-accent">Insights</span>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdate && (
            <span className="label">
              {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <div className="flex items-center gap-2">
            <div className="pulse-dot" />
            <span className="label">Live</span>
          </div>
          <button
            onClick={fetchData}
            className="rounded-md border border-[var(--border)] px-3 py-1 text-xs font-medium text-[var(--text-dim)] transition-all hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Refresh
          </button>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Stats row */}
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            {
              label: "Conversations",
              value: data.stats.totalConversations,
              sub: `${data.stats.successfulCount} successful`,
            },
            {
              label: "Total Talk Time",
              value: formatDuration(data.stats.totalDuration),
              sub: "cumulative",
            },
            {
              label: "Avg Duration",
              value: `${data.stats.avgDuration}s`,
              sub: "per session",
            },
            {
              label: "Messages",
              value: data.stats.totalMessages,
              sub: "exchanged",
            },
            {
              label: "Questions",
              value: data.userMessages.length,
              sub: "from visitors",
            },
          ].map((s) => (
            <div key={s.label} className="card-glow p-4">
              <p className="label mb-2">{s.label}</p>
              <p className="stat-value text-2xl font-bold md:text-3xl">
                {s.value}
              </p>
              <p className="mt-1 text-[10px] text-[var(--text-dim)]">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Two column layout */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left column — Floor map + Questions */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            {/* Floor Interest */}
            <div className="card-glow p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="label label-accent">Floor Interest Map</p>
                <span className="text-[10px] text-[var(--text-dim)]">
                  by mention frequency
                </span>
              </div>
              {sortedFloors.length === 0 ? (
                <p className="text-xs text-[var(--text-dim)]">
                  No floor mentions yet
                </p>
              ) : (
                <div className="space-y-3">
                  {sortedFloors.map(([floor, count]) => (
                    <div key={floor}>
                      <div className="mb-1 flex items-baseline justify-between">
                        <span className="text-xs text-[var(--text-mid)]">
                          {floor}
                        </span>
                        <span className="text-xs font-semibold text-[var(--accent)]">
                          {count}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[var(--surface)]">
                        <div
                          className="bar-glow"
                          style={{
                            width: `${(count / maxMentions) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Visitor Questions */}
            <div className="card-glow flex-1 p-5">
              <p className="label label-accent mb-4">Visitor Questions</p>
              <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
                {data.userMessages.length === 0 ? (
                  <p className="text-xs text-[var(--text-dim)]">
                    No questions yet
                  </p>
                ) : (
                  data.userMessages.map((msg, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs leading-relaxed text-[var(--text-mid)]"
                    >
                      <span className="mr-2 text-[var(--accent)]">&rsaquo;</span>
                      {msg}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right column — Timeline + Summaries */}
          <div className="flex flex-col gap-6 lg:col-span-3">
            {/* Conversation Timeline */}
            <div className="card-glow p-5">
              <p className="label label-accent mb-4">Conversation Feed</p>
              <div className="space-y-3">
                {data.timeline.length === 0 ? (
                  <p className="text-xs text-[var(--text-dim)]">
                    No conversations yet
                  </p>
                ) : (
                  data.timeline.map((conv) => (
                    <div
                      key={conv.id}
                      className="group rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--border-glow)]"
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-2 w-2 rounded-full bg-[var(--accent)]" />
                          <span className="text-xs font-semibold text-[var(--text)]">
                            {formatTime(conv.time)}
                          </span>
                        </div>
                        <div className="flex gap-3 text-[10px] text-[var(--text-dim)]">
                          <span>{formatDuration(conv.duration)}</span>
                          <span>{conv.messageCount} msgs</span>
                        </div>
                      </div>
                      <p className="text-xs leading-relaxed text-[var(--text-mid)]">
                        {conv.summary}
                      </p>
                      {conv.userQuestions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {conv.userQuestions.slice(0, 4).map((q, i) => (
                            <span
                              key={i}
                              className="inline-block rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5 text-[10px] text-[var(--text-dim)]"
                            >
                              {q.length > 50 ? q.slice(0, 50) + "..." : q}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* AI Summaries */}
            {data.summaries.length > 0 && (
              <div className="card-glow p-5">
                <p className="label label-accent mb-4">AI Analysis</p>
                <div className="space-y-3">
                  {data.summaries.map((s, i) => (
                    <div
                      key={i}
                      className="border-l-2 border-[var(--accent-dim)] pl-3"
                    >
                      <p className="text-xs leading-relaxed text-[var(--text-mid)]">
                        {s}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] px-6 py-4 text-center">
        <p className="label">
          TowerMind Insights &mdash; Intelligence at the Frontier, March 2026
        </p>
      </footer>
    </div>
  );
}
