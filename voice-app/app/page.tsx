"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type State = "idle" | "listening" | "thinking" | "speaking";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

const SYSTEM_MESSAGE: Message = {
  role: "system",
  content:
    "You are TowerMind, the AI concierge for Frontier Tower. Keep voice responses concise — 2-3 sentences max. Be warm and direct. People are talking to you out loud at a hackathon. Do NOT use markdown, bullet points, or emojis — you are speaking out loud.",
};

export default function Home() {
  const [state, setState] = useState<State>("idle");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const messagesRef = useRef<Message[]>([SYSTEM_MESSAGE]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [supported, setSupported] = useState(true);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const ttsUnlockedRef = useRef(false);
  const pendingResponseRef = useRef<string | null>(null);

  // Load voices
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      setSupported(false);
      return;
    }

    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) =>
          v.name.includes("Samantha") ||
          v.name.includes("Google US English") ||
          v.name.includes("Karen") ||
          (v.lang.startsWith("en") && v.name.includes("Female"))
      );
      voiceRef.current = preferred || voices.find((v) => v.lang.startsWith("en")) || null;
    };

    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;
  }, []);

  // Speak text aloud — must be called after TTS is unlocked
  const speak = useCallback((text: string) => {
    // Strip markdown formatting for clean speech
    const clean = text
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/#{1,6}\s/g, "")
      .replace(/[-•]\s/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

    setState("speaking");
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.05;
    utterance.pitch = 1;
    if (voiceRef.current) utterance.voice = voiceRef.current;

    utterance.onend = () => setState("idle");
    utterance.onerror = () => setState("idle");

    window.speechSynthesis.speak(utterance);

    // Chrome bug: long utterances pause and never resume
    // Keep-alive interval pokes the synthesis queue
    const keepAlive = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        clearInterval(keepAlive);
        return;
      }
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }, 10000);

    utterance.onend = () => {
      clearInterval(keepAlive);
      setState("idle");
    };
    utterance.onerror = () => {
      clearInterval(keepAlive);
      setState("idle");
    };
  }, []);

  // Watch for pending responses that need to be spoken after TTS unlock
  useEffect(() => {
    if (ttsUnlockedRef.current && pendingResponseRef.current) {
      const text = pendingResponseRef.current;
      pendingResponseRef.current = null;
      speak(text);
    }
  });

  const sendMessage = useCallback(
    async (text: string) => {
      setState("thinking");
      setResponse("");
      setError("");

      messagesRef.current.push({ role: "user", content: text });

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: messagesRef.current }),
        });

        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }

        const data = await res.json();
        const reply =
          data.choices?.[0]?.message?.content || "Sorry, I didn't catch that.";

        messagesRef.current.push({ role: "assistant", content: reply });
        setResponse(reply);

        // Try to speak directly — if TTS was unlocked it will work
        if (ttsUnlockedRef.current) {
          speak(reply);
        } else {
          // Store for later — user will need to tap to hear
          pendingResponseRef.current = reply;
          setState("idle");
        }
      } catch (err) {
        console.error(err);
        setError("Connection error. Tap to try again.");
        setState("idle");
      }
    },
    [speak]
  );

  const startListening = useCallback(() => {
    // CRITICAL: Unlock TTS on user gesture by speaking empty utterance
    if (!ttsUnlockedRef.current) {
      const unlock = new SpeechSynthesisUtterance("");
      window.speechSynthesis.speak(unlock);
      ttsUnlockedRef.current = true;
    }

    // If there's a pending response, speak it now (user tapped)
    if (pendingResponseRef.current) {
      const text = pendingResponseRef.current;
      pendingResponseRef.current = null;
      speak(text);
      return;
    }

    if (state === "speaking") {
      window.speechSynthesis.cancel();
      setState("idle");
      return;
    }

    if (state === "thinking") return;

    setError("");
    setTranscript("");
    setResponse("");

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setState("listening");

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setState((prev) => (prev === "listening" ? "idle" : prev));
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        setError(`Mic error: ${event.error}`);
      }
      setState("idle");
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [state, speak]);

  // Handle final transcript and send message
  useEffect(() => {
    if (state === "listening" && transcript) {
      const timer = setTimeout(() => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
          recognitionRef.current = null;
        }
        if (transcript.trim()) {
          sendMessage(transcript.trim());
        } else {
          setState("idle");
        }
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [transcript, state, sendMessage]);

  const statusLabels: Record<State, string> = {
    idle: "Tap to speak",
    listening: "Listening...",
    thinking: "Thinking...",
    speaking: "Tap to stop",
  };

  if (!supported) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-6 px-8">
        <h1 className="text-2xl font-semibold">TowerMind</h1>
        <p className="text-center text-[var(--text-dim)]">
          Voice requires Chrome or Edge browser. Please open this page in
          Chrome.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-8">
      {/* Header */}
      <div className="flex flex-col items-center gap-1">
        <h1 className="text-xl font-semibold tracking-wide">TowerMind</h1>
        <p className="text-xs text-[var(--text-dim)]">
          Frontier Tower AI Concierge
        </p>
      </div>

      {/* Orb */}
      <div className="orb-container" onClick={startListening}>
        <div className={`orb ${state}`} />
        <div
          className={`ring ${state === "listening" ? "active listening-ring" : state === "speaking" ? "active" : ""}`}
        />
        <div
          className={`ring ring-2 ${state === "listening" ? "active listening-ring" : state === "speaking" ? "active" : ""}`}
        />
      </div>

      {/* Status */}
      <p className="status-text">{statusLabels[state]}</p>

      {/* Transcript */}
      {transcript && (
        <p className="transcript">
          &ldquo;{transcript}&rdquo;
        </p>
      )}

      {/* Response */}
      {response && <p className="response-text">{response}</p>}

      {/* Error */}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* Footer */}
      <p className="fixed bottom-6 text-xs text-[var(--text-dim)]">
        995 Market St, San Francisco
      </p>
    </div>
  );
}
