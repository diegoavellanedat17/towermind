"use client";

import { useEffect, useState, useCallback } from "react";
import { useConversation } from "@11labs/react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const AGENT_ID = "agent_0401kkr0vzjqef4bcw7y33jxk9xq";

const FLOORS: {
  num: number;
  name: string;
  sub: string;
  badge: string;
  badgeBg: string;
  badgeColor: string;
  accent: string;
  live?: boolean;
}[] = [
  { num: 2,  name: "Main Stage",   sub: "Events & Keynotes",     badge: "EVT",    badgeBg: "var(--amber-dim)",   badgeColor: "var(--amber-light)",   accent: "var(--amber)" },
  { num: 4,  name: "Robotics Lab", sub: "G1 + Spot",             badge: "ONLINE", badgeBg: "var(--cyan-dim)",    badgeColor: "var(--cyan-light)",    accent: "var(--cyan)" },
  { num: 6,  name: "Arts & Music", sub: "Creative Studio",       badge: "ART",    badgeBg: "var(--rose-dim)",    badgeColor: "var(--rose-light)",    accent: "var(--rose)" },
  { num: 7,  name: "Makerspace",   sub: "4000 sqft Workshop",    badge: "ONLINE", badgeBg: "var(--cyan-dim)",    badgeColor: "var(--cyan-light)",    accent: "var(--cyan)" },
  { num: 8,  name: "Biotech",      sub: "Wet Labs & Neuro",      badge: "BIO",    badgeBg: "var(--emerald-dim)", badgeColor: "var(--emerald-light)", accent: "var(--emerald)" },
  { num: 9,  name: "AI Floor",     sub: "Hackathon HQ",          badge: "● LIVE", badgeBg: "var(--rose-dim)",    badgeColor: "var(--rose-light)",    accent: "var(--violet)", live: true },
  { num: 11, name: "Longevity",    sub: "VitaDAO Research",      badge: "LONG",   badgeBg: "var(--blue-dim)",    badgeColor: "var(--blue-light)",    accent: "var(--blue)" },
  { num: 12, name: "Ethereum",     sub: "EF Innovation Hub",     badge: "ETH",    badgeBg: "var(--blue-dim)",    badgeColor: "var(--blue-light)",    accent: "var(--blue)" },
];

export default function Home() {
  const [currentTime, setCurrentTime] = useState("");

  const conversation = useConversation({
    onConnect: () => {},
    onDisconnect: () => {},
    onError: () => {},
  });

  const isActive = conversation.status === "connected";
  const isSpeaking = conversation.isSpeaking;

  const handleSpeak = useCallback(async () => {
    if (isActive) {
      await conversation.endSession();
    } else {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        await conversation.startSession({ agentId: AGENT_ID, connectionType: "websocket" });
      } catch {
        // mic denied
      }
    }
  }, [isActive, conversation]);

  useEffect(() => {
    const update = () =>
      setCurrentTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="noise grid-bg relative flex min-h-svh flex-col">
      <div className="scan-line" />

      {/* NAV */}
      <nav className="nav-glass fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-5 py-3 md:px-8">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold tracking-tight text-[var(--text-1)]">
            Tower<span className="text-gradient-violet">Mind</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="mono hidden text-[var(--text-4)] sm:block">{currentTime}</span>
          <Link
            href="/dashboard"
            className="font-[var(--font-mono)]"
            style={{
              fontSize: 13,
              color: "var(--text-3)",
              textDecoration: "none",
              letterSpacing: "0.06em",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--violet-light)";
              e.currentTarget.style.textDecoration = "underline";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-3)";
              e.currentTarget.style.textDecoration = "none";
            }}
          >
            Insights →
          </Link>
        </div>
      </nav>

      {/* MAIN */}
      <main className="relative z-10 flex flex-1 flex-col items-center px-5 pb-28 md:px-8">

        {/* ─── HERO ─── */}
        <section className="flex flex-col items-center text-center" style={{ paddingTop: 100, paddingBottom: 80 }}>

          {/* 1. Location label */}
          <p
            className="anim-location font-[var(--font-mono)]"
            style={{
              fontSize: 11,
              color: "var(--text-4)",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: 24,
            }}
          >
            FRONTIER TOWER · 995 MARKET ST · SAN FRANCISCO
          </p>

          {/* 2. Name + ONLINE badge */}
          <div className="anim-name flex items-center">
            <h1
              className="font-[var(--font-ui)]"
              style={{
                fontSize: "clamp(40px, 8vw, 68px)",
                fontWeight: 600,
                color: "var(--text-1)",
                lineHeight: 1,
              }}
            >
              TowerMind
            </h1>
            <span
              className="font-[var(--font-mono)]"
              style={{
                background: "var(--emerald-dim)",
                border: "1px solid rgba(16,185,129,0.2)",
                borderRadius: 100,
                padding: "4px 12px",
                fontSize: 10,
                color: "var(--emerald-light)",
                letterSpacing: "0.14em",
                marginLeft: 16,
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ animation: "pulse-dot 2.4s ease-in-out infinite", display: "inline-block" }}>●</span>
              {" "}ONLINE
            </span>
          </div>

          {/* 3. Tagline */}
          <h2
            className="anim-tagline font-[var(--font-ui)]"
            style={{
              fontSize: "clamp(28px, 5vw, 52px)",
              fontWeight: 300,
              color: "var(--text-1)",
              lineHeight: 1.1,
              marginTop: 40,
              maxWidth: 640,
            }}
          >
            Speak with the building.
          </h2>

          {/* 4. Subtitle */}
          <p
            className="anim-subtitle font-[var(--font-ui)]"
            style={{
              fontSize: 16,
              fontWeight: 400,
              color: "var(--text-2)",
              lineHeight: 1.7,
              marginTop: 20,
              maxWidth: 480,
            }}
          >
            AI concierge for Frontier Tower. Ask about floors, events, people,
            or anything happening right now.
          </p>

          {/* 5. Speak orb */}
          <div className="anim-speak" style={{ marginTop: 56 }}>
            <div className="orb-container">
              <div className={`orb-ring orb-ring-1 ${isActive ? "active" : ""}`} />
              <div className={`orb-ring orb-ring-2 ${isActive ? "active" : ""}`} />
              <div className={`orb-ring orb-ring-3 ${isActive ? "active" : ""}`} />
              <div
                className={`orb-core ${isActive ? "active" : ""}`}
                onClick={handleSpeak}
                role="button"
                tabIndex={0}
                aria-label={isActive ? "End conversation" : "Start conversation"}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleSpeak(); }}
              />
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={isActive ? (isSpeaking ? "speaking" : "listening") : "idle"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="mono"
                style={{ marginTop: 16, textAlign: "center", color: "var(--text-3)", fontSize: 11 }}
              >
                {isActive && isSpeaking ? (
                  <span style={{ color: "var(--cyan-light)" }}>Speaking...</span>
                ) : isActive ? (
                  <span style={{ color: "var(--violet-light)" }}>Listening · tap to end</span>
                ) : (
                  "Tap to speak"
                )}
              </motion.p>
            </AnimatePresence>
          </div>
        </section>

        {/* ─── FLOORS ─── */}
        <section className="w-full max-w-[920px]">

          {/* Header */}
          <div className="anim-section-hdr" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <span className="font-[var(--font-mono)]" style={{ fontSize: 11, color: "var(--text-4)", letterSpacing: "0.2em" }}>
              ACTIVE FLOORS
            </span>
            <span className="font-[var(--font-mono)]" style={{ fontSize: 11, color: "var(--cyan-light)", letterSpacing: "0.1em" }}>
              {String(FLOORS.length).padStart(2, "0")} / 12 ONLINE
            </span>
          </div>
          <div style={{ height: 1, background: "var(--border-dim)" }} />

          {/* Grid */}
          <div
            className="floor-grid anim-floor-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 1,
              background: "var(--border-dim)",
              borderRadius: 12,
              overflow: "hidden",
              marginTop: 24,
            }}
          >
            {FLOORS.map((f) => (
              <div
                key={f.num}
                className="floor-card"
                style={{
                  background: f.live ? "var(--surface-2)" : "var(--surface-1)",
                  padding: "22px 20px 20px",
                  cursor: "default",
                  transition: "background 0.15s ease, box-shadow 0.15s ease",
                  ...(f.live ? { boxShadow: "inset 3px 0 0 var(--violet)" } : {}),
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.background = "var(--surface-2)";
                  el.style.boxShadow = `inset 3px 0 0 ${f.accent}`;
                  const numEl = el.querySelector<HTMLElement>("[data-num]");
                  if (numEl) numEl.style.color = "var(--text-2)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.background = f.live ? "var(--surface-2)" : "var(--surface-1)";
                  el.style.boxShadow = f.live ? "inset 3px 0 0 var(--violet)" : "none";
                  const numEl = el.querySelector<HTMLElement>("[data-num]");
                  if (numEl) numEl.style.color = f.live ? "var(--violet-light)" : "var(--text-4)";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span
                    data-num=""
                    className="font-[var(--font-mono)]"
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: f.live ? "var(--violet-light)" : "var(--text-4)",
                      transition: "color 0.15s ease",
                    }}
                  >
                    {String(f.num).padStart(2, "0")}F
                  </span>
                  <span
                    className="font-[var(--font-mono)]"
                    style={{
                      fontSize: 9,
                      letterSpacing: "0.14em",
                      borderRadius: 4,
                      padding: "3px 8px",
                      background: f.badgeBg,
                      color: f.badgeColor,
                    }}
                  >
                    {f.badge === "● LIVE" ? (
                      <>
                        <span style={{ animation: "pulse-dot 2.4s ease-in-out infinite", display: "inline-block" }}>●</span>
                        {" "}LIVE
                      </>
                    ) : f.badge}
                  </span>
                </div>
                <p className="font-[var(--font-ui)]" style={{ fontSize: 14, fontWeight: 500, color: "var(--text-1)", marginTop: 14 }}>
                  {f.name}
                </p>
                <p className="font-[var(--font-mono)]" style={{ fontSize: 11, color: "var(--text-3)", marginTop: 5 }}>
                  {f.sub}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── STATS BAR ─── */}
        <div
          className="stats-bar anim-stats w-full max-w-[920px]"
          style={{
            marginTop: 96,
            display: "flex",
            flexDirection: "row",
            borderTop: "1px solid var(--border-dim)",
            borderBottom: "1px solid var(--border-dim)",
          }}
        >
          {[
            { value: "1000+", label: "ATTENDEES", gradient: true },
            { value: "70+",   label: "SPEAKERS",  gradient: false },
            { value: "12",    label: "FLOORS ACTIVE", gradient: false },
          ].map((stat, i, arr) => (
            <div
              key={stat.label}
              style={{
                flex: 1,
                padding: "40px 0 40px 32px",
                borderRight: i < arr.length - 1 ? "1px solid var(--border-dim)" : "none",
              }}
            >
              <p
                className="font-[var(--font-ui)]"
                style={{
                  fontSize: "clamp(32px, 5vw, 52px)",
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
              <p
                className="font-[var(--font-mono)]"
                style={{
                  fontSize: 11,
                  color: "var(--text-4)",
                  letterSpacing: "0.18em",
                  marginTop: 10,
                }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* ─── FOOTER ─── */}
      <footer
        className="w-full max-w-[920px] mx-auto"
        style={{
          marginTop: 0,
          borderTop: "1px solid var(--border-dim)",
          padding: "28px 20px 64px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <span
          className="font-[var(--font-mono)]"
          style={{ fontSize: 11, color: "var(--text-4)", letterSpacing: "0.18em" }}
        >
          <span style={{ animation: "pulse-dot 2.4s ease-in-out infinite", display: "inline-block", color: "var(--emerald-light)", marginRight: 8 }}>●</span>
          TOWERMIND
        </span>
        <span
          className="font-[var(--font-mono)]"
          style={{ fontSize: 11, color: "var(--text-4)", letterSpacing: "0.1em" }}
        >
          ELEVENLABS × CLAUDE SONNET 4.6
        </span>
      </footer>
    </div>
  );
}
