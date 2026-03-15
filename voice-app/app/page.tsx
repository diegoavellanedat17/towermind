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

function cleanForSpeech(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/[-•]\s/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[🚀🏗️🔬🎨🔧⚡️💡🤖]/g, "");
}

export default function Home() {
  const [state, setState] = useState<State>("idle");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const messagesRef = useRef<Message[]>([SYSTEM_MESSAGE]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [supported, setSupported] = useState(true);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTextRef = useRef<string | null>(null);

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
      voiceRef.current =
        preferred || voices.find((v) => v.lang.startsWith("en")) || null;
    };

    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;
  }, []);

  const cleanupSpeech = useCallback(() => {
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
    window.speechSynthesis.cancel();
  }, []);

  // Force speak — called during user gesture context
  const speakNow = useCallback(
    (text: string) => {
      cleanupSpeech();
      setState("speaking");

      const clean = cleanForSpeech(text);

      // Small delay after cancel() to let Chrome reset
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.rate = 1.05;
        utterance.pitch = 1;
        if (voiceRef.current) utterance.voice = voiceRef.current;

        const done = () => {
          if (keepAliveRef.current) clearInterval(keepAliveRef.current);
          if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
          keepAliveRef.current = null;
          safetyTimerRef.current = null;
          setState("idle");
        };

        utterance.onend = done;
        utterance.onerror = done;

        window.speechSynthesis.speak(utterance);

        // Chrome keep-alive: poke synthesis to prevent hanging on long text
        keepAliveRef.current = setInterval(() => {
          if (!window.speechSynthesis.speaking) {
            done();
            return;
          }
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }, 5000);

        // Safety timeout: if speech doesn't end in 30s, force idle
        safetyTimerRef.current = setTimeout(() => {
          if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
          }
          done();
        }, 30000);
      }, 50);
    },
    [cleanupSpeech]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      setState("thinking");
      setResponse("");
      setError("");
      pendingTextRef.current = null;

      messagesRef.current.push({ role: "user", content: text });

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: messagesRef.current }),
        });

        if (!res.ok) throw new Error(`API error: ${res.status}`);

        const data = await res.json();
        const reply =
          data.choices?.[0]?.message?.content || "Sorry, I didn't catch that.";

        messagesRef.current.push({ role: "assistant", content: reply });
        setResponse(reply);

        // Try to speak — may be blocked on mobile if gesture expired
        // Store as pending so user can tap to hear
        pendingTextRef.current = reply;
        speakNow(reply);
      } catch (err) {
        console.error(err);
        setError("Connection error. Tap to try again.");
        setState("idle");
      }
    },
    [speakNow]
  );

  const startListening = useCallback(() => {
    // ALWAYS unlock TTS on every tap — mobile Chrome re-locks between gestures
    cleanupSpeech();
    const warmup = new SpeechSynthesisUtterance("");
    window.speechSynthesis.speak(warmup);

    // If there's a pending response that didn't speak, speak it now
    if (pendingTextRef.current && state !== "speaking") {
      const text = pendingTextRef.current;
      pendingTextRef.current = null;
      speakNow(text);
      return;
    }

    if (state === "speaking") {
      cleanupSpeech();
      setState("idle");
      return;
    }

    if (state === "thinking") return;
    if (state === "listening") {
      // Already listening — stop early
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }

    setError("");
    setTranscript("");
    setResponse("");
    pendingTextRef.current = null;

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
  }, [state, cleanupSpeech, speakNow]);

  // Auto-send after silence
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
          Voice requires Chrome or Edge. Please open this page in Chrome.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-8">
      <div className="flex flex-col items-center gap-1">
        <h1 className="text-xl font-semibold tracking-wide">TowerMind</h1>
        <p className="text-xs text-[var(--text-dim)]">
          Frontier Tower AI Concierge
        </p>
      </div>

      <div className="orb-container" onClick={startListening}>
        <div className={`orb ${state}`} />
        <div
          className={`ring ${state === "listening" ? "active listening-ring" : state === "speaking" ? "active" : ""}`}
        />
        <div
          className={`ring ring-2 ${state === "listening" ? "active listening-ring" : state === "speaking" ? "active" : ""}`}
        />
      </div>

      <p className="status-text">{statusLabels[state]}</p>

      {transcript && (
        <p className="transcript">&ldquo;{transcript}&rdquo;</p>
      )}

      {response && <p className="response-text">{response}</p>}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <p className="fixed bottom-6 text-xs text-[var(--text-dim)]">
        995 Market St, San Francisco
      </p>
    </div>
  );
}
