import { NextRequest, NextResponse } from "next/server";

const OPENCLAW_URL = process.env.OPENCLAW_URL || "http://204.168.142.104:18789";
const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN || "";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const response = await fetch(`${OPENCLAW_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENCLAW_TOKEN}`,
        "x-openclaw-agent-id": "main",
      },
      body: JSON.stringify({
        model: "openclaw",
        messages,
        user: "towermind-voice",
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: `OpenClaw error: ${response.status} ${text}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to connect to TowerMind backend" },
      { status: 500 }
    );
  }
}
