# TowerMind — Frontier Tower AI Concierge

Voice-enabled AI agent for **Frontier Tower**, a 16-floor innovation hub at 995 Market Street, San Francisco.

Walk up, scan the QR code, tap, and **talk** to the building.

## What It Does

- **Wayfinding** — Find any floor, lab, or event space
- **Onboarding** — Learn how the building works, membership, governance
- **Coordination** — Cross-floor collaboration, event info, resource discovery
- **Live Event Support** — Real-time help for Intelligence at the Frontier hackathon (1000+ attendees, 70+ speakers)

## Architecture

```
Browser (Voice)                    VPS (204.168.142.104)
┌─────────────────┐               ┌─────────────────────┐
│  Web Speech API │               │   OpenClaw Gateway   │
│  (STT + TTS)    │──── HTTPS ───▶│   Claude Sonnet 4.6  │
│  Next.js on     │   /api/chat   │   SOUL.md + MEMORY.md│
│  Vercel         │◀──────────────│   (Building Knowledge)│
└─────────────────┘               └─────────────────────┘
```

- **Frontend:** Next.js on Vercel — pulsing orb UI, Web Speech API for voice
- **Backend:** OpenClaw (open-source AI gateway) running Claude Sonnet 4.6
- **Knowledge:** SOUL.md (personality) + MEMORY.md (building data) configured on VPS
- **Cost:** $0 for voice (browser-native STT/TTS)

## Building Data

| Floor | Focus |
|-------|-------|
| 2 | Main Stage & Town Halls |
| 3 | Private Offices |
| 4 | Robotics Lab (Unitree G1, Boston Dynamics Spot) |
| 6 | Arts & Music |
| 7 | Makerspace (4000 sqft, laser cutters, 3D printers) |
| 8 | Biotech & Neuro |
| 9 | AI & Hackathon Venue |
| 11 | Longevity (VitaDAO) |
| 12 | Ethereum House (EF hub, quadratic funding) |
| 14 | Flourishing & Sustainability |

## Tech Stack

- Next.js 16 + TypeScript
- Web Speech API (SpeechRecognition + SpeechSynthesis)
- OpenClaw v2026.3.11 + Claude Sonnet 4.6
- Vercel (frontend) + VPS (backend)

## Setup

```bash
cd voice-app
npm install
cp .env.example .env.local
# Edit .env.local with your OpenClaw credentials
npm run dev
```

## Hackathon

**Intelligence at the Frontier** — March 14-15, 2026
Track: Agentic Funding & Coordination (Frontier Tower Agent)
Prize: $500 + 1 year Frontier Tower membership
