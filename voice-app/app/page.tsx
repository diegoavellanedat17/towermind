"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

const AGENT_ID = "agent_0401kkr0vzjqef4bcw7y33jxk9xq";

const FLOORS = [
  { num: 2, name: "Main Stage", tag: "Events" },
  { num: 4, name: "Robotics Lab", tag: "G1 + Spot" },
  { num: 6, name: "Arts & Music", tag: "Creative" },
  { num: 7, name: "Makerspace", tag: "4000 sqft" },
  { num: 8, name: "Biotech", tag: "Wet Labs" },
  { num: 9, name: "AI Floor", tag: "Hackathon" },
  { num: 11, name: "Longevity", tag: "VitaDAO" },
  { num: 12, name: "Ethereum", tag: "EF Hub" },
];

export default function Home() {
  const widgetLoaded = useRef(false);

  useEffect(() => {
    if (widgetLoaded.current) return;
    widgetLoaded.current = true;
    const script = document.createElement("script");
    script.src = "https://elevenlabs.io/convai-widget/index.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div className="bg-cockpit grid-pattern relative flex min-h-screen flex-col items-center overflow-hidden">
      {/* Scan line effect */}
      <div className="scan-line" />

      {/* Top bar */}
      <nav className="relative z-10 flex w-full items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="pulse-dot" />
          <span className="label">System Active</span>
        </div>
        <Link
          href="/dashboard"
          className="label rounded-md border border-[var(--border)] px-3 py-1.5 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          Insights Dashboard
        </Link>
      </nav>

      {/* Main content */}
      <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 pb-24">
        {/* Title block */}
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="label label-accent">Frontier Tower / 995 Market St</p>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Tower<span className="text-[var(--accent)]">Mind</span>
          </h1>
          <p className="max-w-sm text-sm leading-relaxed text-[var(--text-dim)]">
            Voice-enabled AI concierge. Tap to speak with the building.
          </p>
        </div>

        {/* Orb zone */}
        <div className="relative flex items-center justify-center" style={{ width: 300, height: 300 }}>
          <div className="orb-ring orb-ring-1" />
          <div className="orb-ring orb-ring-2" />
          <div className="orb-ring orb-ring-3" />
          <div className="agent-orb" />
        </div>

        {/* Floor map — horizontal scroll on mobile */}
        <div className="w-full max-w-2xl">
          <p className="label mb-3 text-center">Active Floors</p>
          <div className="flex flex-wrap justify-center gap-2">
            {FLOORS.map((f) => (
              <div
                key={f.num}
                className="card-glow flex items-center gap-2.5 px-3 py-2"
              >
                <span className="text-xs font-bold text-[var(--accent)]">
                  {f.num}F
                </span>
                <span className="text-xs text-[var(--text-mid)]">{f.name}</span>
                <span className="rounded-full bg-[var(--accent-dim)] px-1.5 py-0.5 text-[9px] font-medium text-[var(--accent-glow)]">
                  {f.tag}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Live event banner */}
        <div className="card-glow flex items-center gap-3 px-5 py-3">
          <div className="pulse-dot" />
          <p className="text-xs text-[var(--text-mid)]">
            <span className="font-semibold text-[var(--text)]">Intelligence at the Frontier</span>
            {" "}&mdash; 1000+ attendees, 70+ speakers, Floor 9
          </p>
        </div>
      </main>

      {/* ElevenLabs widget */}
      {/* @ts-expect-error Custom element */}
      <elevenlabs-convai agent-id={AGENT_ID}></elevenlabs-convai>

      {/* Bottom bar */}
      <footer className="fixed bottom-0 left-0 right-0 flex items-center justify-center border-t border-[var(--border)] bg-black/80 px-6 py-3 backdrop-blur-sm">
        <p className="label">
          Powered by ElevenLabs + Claude Sonnet 4.6
        </p>
      </footer>
    </div>
  );
}
