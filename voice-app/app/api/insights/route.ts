import { NextResponse } from "next/server";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";
const AGENT_ID = "agent_0401kkr0vzjqef4bcw7y33jxk9xq";

interface Conversation {
  conversation_id: string;
  start_time_unix_secs: number;
  call_duration_secs: number;
  message_count: number;
  status: string;
  call_successful: string;
  call_summary_title: string;
  main_language: string;
}

interface TranscriptMessage {
  role: string;
  message: string;
  time_in_call_secs?: number;
}

interface ConversationDetail {
  transcript: TranscriptMessage[];
  analysis?: {
    transcript_summary?: string;
  };
  conversation_id: string;
  start_time_unix_secs: number;
  call_duration_secs: number;
  status: string;
}

export async function GET() {
  try {
    // Fetch all conversations
    const listRes = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations?agent_id=${AGENT_ID}`,
      { headers: { "xi-api-key": ELEVENLABS_API_KEY }, next: { revalidate: 0 } }
    );

    if (!listRes.ok) {
      return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
    }

    const listData = await listRes.json();
    const conversations: Conversation[] = listData.conversations || [];

    // Filter only successful conversations
    const successful = conversations.filter(
      (c: Conversation) => c.call_successful === "success"
    );

    // Fetch details for each (up to 20 most recent)
    const details: ConversationDetail[] = await Promise.all(
      successful.slice(0, 20).map(async (conv: Conversation) => {
        const res = await fetch(
          `https://api.elevenlabs.io/v1/convai/conversations/${conv.conversation_id}`,
          { headers: { "xi-api-key": ELEVENLABS_API_KEY } }
        );
        if (!res.ok) return null;
        return res.json();
      })
    ).then((results) => results.filter(Boolean) as ConversationDetail[]);

    // Extract insights
    const totalConversations = conversations.length;
    const successfulCount = successful.length;
    const totalDuration = successful.reduce(
      (sum: number, c: Conversation) => sum + (c.call_duration_secs || 0),
      0
    );
    const avgDuration =
      successfulCount > 0 ? Math.round(totalDuration / successfulCount) : 0;
    const totalMessages = successful.reduce(
      (sum: number, c: Conversation) => sum + (c.message_count || 0),
      0
    );

    // Extract user messages from transcripts
    const userMessages: string[] = [];
    const summaries: string[] = [];

    for (const detail of details) {
      if (detail.analysis?.transcript_summary) {
        summaries.push(detail.analysis.transcript_summary);
      }
      if (detail.transcript) {
        for (const msg of detail.transcript) {
          if (msg.role === "user" && msg.message) {
            userMessages.push(msg.message);
          }
        }
      }
    }

    // Simple topic extraction — count floor mentions
    const floorMentions: Record<string, number> = {};
    const allText = [...userMessages, ...summaries].join(" ").toLowerCase();
    const floors: Record<string, string[]> = {
      "Floor 2 - Main Stage": ["floor 2", "main stage", "town hall", "keynote"],
      "Floor 3 - Offices": ["floor 3", "office", "private office"],
      "Floor 4 - Robotics": ["floor 4", "robot", "unitree", "spot", "boston dynamics"],
      "Floor 6 - Arts": ["floor 6", "art", "music", "creative"],
      "Floor 7 - Makerspace": ["floor 7", "makerspace", "maker", "laser", "3d print", "cnc"],
      "Floor 8 - Biotech": ["floor 8", "biotech", "neuro", "wet lab"],
      "Floor 9 - AI/Hackathon": ["floor 9", "hackathon", "ai floor"],
      "Floor 11 - Longevity": ["floor 11", "longevity", "vitadao", "aging"],
      "Floor 12 - Ethereum": ["floor 12", "ethereum", "crypto", "web3", "quadratic"],
      "Floor 14 - Sustainability": ["floor 14", "sustainability", "flourishing"],
    };

    for (const [floor, keywords] of Object.entries(floors)) {
      const count = keywords.reduce(
        (sum, kw) => sum + (allText.split(kw).length - 1),
        0
      );
      if (count > 0) floorMentions[floor] = count;
    }

    // Build conversation timeline
    const timeline = details.map((d) => ({
      id: d.conversation_id,
      time: d.start_time_unix_secs,
      duration: d.call_duration_secs,
      summary: d.analysis?.transcript_summary || "No summary",
      messageCount: d.transcript?.length || 0,
      userQuestions: (d.transcript || [])
        .filter((m: TranscriptMessage) => m.role === "user")
        .map((m: TranscriptMessage) => m.message),
    }));

    return NextResponse.json({
      stats: {
        totalConversations,
        successfulCount,
        totalDuration,
        avgDuration,
        totalMessages,
      },
      floorMentions,
      summaries,
      timeline,
      userMessages,
    });
  } catch (error) {
    console.error("Insights error:", error);
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}
