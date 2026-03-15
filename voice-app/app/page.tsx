"use client";

import { useEffect, useRef } from "react";

const AGENT_ID = "agent_0401kkr0vzjqef4bcw7y33jxk9xq";

export default function Home() {
  const widgetLoaded = useRef(false);

  useEffect(() => {
    if (widgetLoaded.current) return;
    widgetLoaded.current = true;

    // Load ElevenLabs widget script
    const script = document.createElement("script");
    script.src = "https://elevenlabs.io/convai-widget/index.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-8">
      {/* Header */}
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-3xl font-bold tracking-wide">TowerMind</h1>
        <p className="text-sm text-[var(--text-dim)]">
          Frontier Tower AI Concierge
        </p>
        <p className="mt-4 max-w-md text-center text-sm text-[var(--text-dim)] leading-relaxed">
          Tap the button below to start a voice conversation.
          Ask me about any floor, the hackathon, membership, or anything else about the building.
        </p>
      </div>

      {/* Building info card */}
      <div className="max-w-sm rounded-xl border border-[#222] bg-[#111] p-5 text-sm leading-relaxed text-[var(--text-dim)]">
        <p className="mb-3 text-xs uppercase tracking-widest text-[var(--accent)]">
          995 Market St, San Francisco
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <span>Floor 4 — Robotics</span>
          <span>Floor 7 — Makerspace</span>
          <span>Floor 8 — Biotech</span>
          <span>Floor 9 — AI & Hackathon</span>
          <span>Floor 11 — Longevity</span>
          <span>Floor 12 — Ethereum</span>
        </div>
      </div>

      {/* ElevenLabs widget — injected via custom element */}
      {/* @ts-expect-error Custom element */}
      <elevenlabs-convai agent-id={AGENT_ID}></elevenlabs-convai>

      {/* Footer */}
      <p className="fixed bottom-6 text-xs text-[var(--text-dim)]">
        Intelligence at the Frontier — March 14-15, 2026
      </p>
    </div>
  );
}
