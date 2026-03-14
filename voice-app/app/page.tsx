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
    "You are TowerMind, the AI concierge for Frontier Tower. Keep voice responses concise — 2-3 sentences max. Be warm and direct. People are talking to you out loud at a hackathon.",
};

export default function Home() {
  const [state, setState] = useState<State>("idle");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const messagesRef = useRef<Message[]>([SYSTEM_MESSAGE]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      setSupported(false);
    }
  }, []);

  const speak = useCallback((text: string) => {
    setState("speaking");
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1;

    // Try to pick a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) =>
        v.name.includes("Samantha") ||
        v.name.includes("Karen") ||
        v.name.includes("Google US English") ||
        (v.lang.startsWith("en") && v.name.includes("Female"))
    );
    if (preferred) utterance.voice = preferred;

    utterance.onend = () => setState("idle");
    utterance.onerror = () => setState("idle");

    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

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
        speak(reply);
      } catch (err) {
        console.error(err);
        setError("Connection error. Tap to try again.");
        setState("idle");
      }
    },
    [speak]
  );

  const startListening = useCallback(() => {
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
      const text = transcript || "";
      // Use the latest transcript from the closure
      recognitionRef.current = null;
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
  }, [state, transcript]);

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
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [transcript, state, sendMessage]);

  const statusLabels: Record<State, string> = {
    idle: "Tap to speak",
    listening: "Listening...",
    thinking: "Thinking...",
    speaking: "Speaking — tap to stop",
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
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {/* Footer */}
      <p className="fixed bottom-6 text-xs text-[var(--text-dim)]">
        995 Market St, San Francisco
      </p>
    </div>
  );
}
