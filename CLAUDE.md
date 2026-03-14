# TowerMind — Frontier Tower Conversational Agent

**Hackathon:** Intelligence at the Frontier (March 14-15, 2026)
**Track:** Agentic Funding & Coordination (Frontier Tower Agent)
**Prize:** $500 + 1 year Frontier Tower membership

## What This Is
A live conversational agent for Frontier Tower (16-floor innovation hub, 995 Market St, SF). Runs on existing OpenClaw VPS. People at the event can talk to it right now.

## Tech Stack
- OpenClaw v2026.2.4 on VPS (46.224.230.194)
- Reconfigure SOUL.md + MEMORY.md with building knowledge
- Static landing page with QR code on Vercel/GitHub Pages

## Deployment
- SSH to root@46.224.230.194
- Update /root/.openclaw/ config files
- Restart OpenClaw container
- Expose webchat URL

## Rules
- FUNCTIONAL — real people must be able to talk to it
- Must have accurate building data
- Must help with real coordination (not just trivia)
