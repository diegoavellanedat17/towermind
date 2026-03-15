"use client";

import { useState, useEffect, useCallback } from "react";

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

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-[#222] bg-[#111] p-5">
      <p className="text-xs uppercase tracking-widest text-[#888]">{label}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-[#666]">{sub}</p>}
    </div>
  );
}

function formatTime(unix: number): string {
  return new Date(unix * 1000).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
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
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
        <p className="text-[#888]">Loading insights...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  const sortedFloors = Object.entries(data.floorMentions).sort(
    ([, a], [, b]) => b - a
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 text-white">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">TowerMind Insights</h1>
          <p className="text-sm text-[#888]">
            Real-time conversation intelligence for Frontier Tower
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#666]">
            Auto-refreshes every 30s
          </p>
          {lastUpdate && (
            <p className="text-xs text-[#888]">
              Last update: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
          <button
            onClick={fetchData}
            className="mt-1 rounded-lg bg-[#6366f1] px-3 py-1 text-xs text-white hover:bg-[#5558e6]"
          >
            Refresh Now
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatCard
          label="Conversations"
          value={data.stats.totalConversations}
          sub={`${data.stats.successfulCount} successful`}
        />
        <StatCard
          label="Total Talk Time"
          value={`${Math.round(data.stats.totalDuration / 60)}m`}
          sub={`${data.stats.totalDuration}s total`}
        />
        <StatCard
          label="Avg Duration"
          value={`${data.stats.avgDuration}s`}
          sub="per conversation"
        />
        <StatCard
          label="Messages"
          value={data.stats.totalMessages}
          sub="across all convos"
        />
        <StatCard
          label="Unique Questions"
          value={data.userMessages.length}
          sub="from visitors"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Floor Interest */}
        <div className="rounded-xl border border-[#222] bg-[#111] p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#6366f1]">
            Floor Interest Map
          </h2>
          {sortedFloors.length === 0 ? (
            <p className="text-sm text-[#666]">No floor mentions yet</p>
          ) : (
            <div className="space-y-3">
              {sortedFloors.map(([floor, count]) => (
                <div key={floor}>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#ccc]">{floor}</span>
                    <span className="text-[#888]">
                      {count} mention{count !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-[#1a1a1a]">
                    <div
                      className="h-2 rounded-full bg-[#6366f1]"
                      style={{
                        width: `${Math.min(100, (count / Math.max(...sortedFloors.map(([, c]) => c))) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* What People Are Asking */}
        <div className="rounded-xl border border-[#222] bg-[#111] p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#6366f1]">
            What People Are Asking
          </h2>
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {data.userMessages.length === 0 ? (
              <p className="text-sm text-[#666]">No questions yet</p>
            ) : (
              data.userMessages.map((msg, i) => (
                <div
                  key={i}
                  className="rounded-lg bg-[#1a1a1a] px-3 py-2 text-sm text-[#ccc]"
                >
                  &ldquo;{msg}&rdquo;
                </div>
              ))
            )}
          </div>
        </div>

        {/* Conversation Timeline */}
        <div className="rounded-xl border border-[#222] bg-[#111] p-5 md:col-span-2">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#6366f1]">
            Conversation Timeline
          </h2>
          <div className="space-y-4">
            {data.timeline.length === 0 ? (
              <p className="text-sm text-[#666]">No conversations yet</p>
            ) : (
              data.timeline.map((conv) => (
                <div
                  key={conv.id}
                  className="rounded-lg border border-[#1a1a1a] bg-[#0d0d0d] p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {formatTime(conv.time)}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-[#999]">
                        {conv.summary}
                      </p>
                    </div>
                    <div className="ml-4 text-right text-xs text-[#666]">
                      <p>{conv.duration}s</p>
                      <p>{conv.messageCount} msgs</p>
                    </div>
                  </div>
                  {conv.userQuestions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {conv.userQuestions.map((q, i) => (
                        <span
                          key={i}
                          className="inline-block rounded-full bg-[#1a1a1a] px-2 py-1 text-xs text-[#aaa]"
                        >
                          {q.length > 60 ? q.slice(0, 60) + "..." : q}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* AI Summaries */}
      {data.summaries.length > 0 && (
        <div className="mt-6 rounded-xl border border-[#222] bg-[#111] p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#6366f1]">
            AI Conversation Summaries
          </h2>
          <div className="space-y-3">
            {data.summaries.map((s, i) => (
              <p key={i} className="text-sm leading-relaxed text-[#999]">
                {s}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <p className="mt-8 text-center text-xs text-[#444]">
        TowerMind Insights — Intelligence at the Frontier, March 14-15, 2026
      </p>
    </div>
  );
}
