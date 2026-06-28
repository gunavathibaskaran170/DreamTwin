"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, MessageCircle } from "lucide-react";
import clsx from "clsx";
import TwinAvatar from "./TwinAvatar";
import type { DigitalTwin, TwinMessage } from "@/lib/types";
import { synth } from "@/lib/synth-audio";

interface TwinChatProps {
  twin: DigitalTwin;
  onTwinUpdate?: (twin: DigitalTwin) => void;
  compact?: boolean;
  onLog?: (msg: string) => void;
  onStatus?: (agent: "planner" | "motivator" | "sync", status: "IDLE" | "THINKING" | "ACTIVE") => void;
}

const TWIN_BUBBLE_CLASSES: Record<string, string> = {
  spark: "bg-dream-600/15 border border-dream-500/20 text-white/90",
  compass: "bg-blue-600/15 border border-blue-500/20 text-white/90",
  star: "bg-amber-600/15 border border-amber-500/20 text-white/90",
  flame: "bg-rose-600/15 border border-rose-500/20 text-white/90",
};

const USER_BUBBLE_CLASSES: Record<string, string> = {
  spark: "bg-dream-600/30 border border-dream-500/30 text-white/95",
  compass: "bg-blue-600/30 border border-blue-500/30 text-white/95",
  star: "bg-amber-600/30 border border-amber-500/30 text-white/95",
  flame: "bg-rose-600/30 border border-rose-500/30 text-white/95",
};

export default function TwinChat({
  twin,
  onTwinUpdate,
  compact,
  onLog,
  onStatus,
}: TwinChatProps) {
  const [messages, setMessages] = useState<TwinMessage[]>(twin.messages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(twin.messages);
  }, [twin.messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const speakText = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (synth.isMuted()) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) => v.lang.includes("en")) || voices[0];
    if (voice) utterance.voice = voice;
    utterance.rate = 1.0;
    utterance.pitch = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setLoading(true);
    synth.playScan();
    onLog?.(`Comm Node Out: "${userMsg}"`);
    onStatus?.("motivator", "THINKING");

    setMessages((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        role: "user",
        content: userMsg,
        timestamp: new Date().toISOString(),
      },
    ]);

    try {
      const res = await fetch("/api/twin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      if (data.twin) {
        setMessages(data.twin.messages);
        onTwinUpdate?.(data.twin);
        onLog?.(`Twin response received.`);
        if (data.reply) {
          speakText(data.reply);
        }
      }
    } catch {
      onLog?.(`Connection to twin failed.`);
    } finally {
      setLoading(false);
      onStatus?.("motivator", "IDLE");
    }
  };

  const suggestions = compact
    ? ["How am I doing?", "Motivate me"]
    : ["Who are you?", "How's my progress?", "I'm feeling stuck", "What should I focus on?"];

  const avatarType = twin.avatar ?? "spark";

  return (
    <div className={clsx("flex flex-col", compact ? "h-72" : "h-96")}>
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <MessageCircle className="w-8 h-8 text-white/20 mx-auto mb-2" />
            <p className="text-xs text-white/40">
              Ask {twin.twinName} anything about your dreams
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={clsx(
              "flex gap-2",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {msg.role === "twin" && (
              <TwinAvatar avatar={twin.avatar} syncLevel={twin.syncLevel} size="sm" pulse={false} />
            )}
            <div
              className={clsx(
                "max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                msg.role === "user"
                  ? USER_BUBBLE_CLASSES[avatarType]
                  : TWIN_BUBBLE_CLASSES[avatarType]
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2 items-start animate-fade-in">
            <TwinAvatar avatar={twin.avatar} syncLevel={twin.syncLevel} size="sm" pulse={false} />
            <div className="bg-white/5 rounded-2xl px-3.5 py-2.5 border border-white/10 flex flex-col gap-1">
              <span className="text-[8px] text-white/30 font-medium uppercase tracking-wider">Reflecting...</span>
              <div className="flex items-center gap-1.5 h-3">
                <span className="w-1.5 h-1.5 rounded-full bg-dream-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-dream-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-dream-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {!compact && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { synth.playClick(); setInput(s); }}
              className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/50 hover:border-dream-500/30 hover:text-white/70 transition-colors cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={`Message ${twin.twinName}...`}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-dream-500/50"
        />
        <button
          type="button"
          onClick={send}
          disabled={!input.trim() || loading}
          className="p-2.5 rounded-xl bg-dream-600 hover:bg-dream-500 disabled:opacity-30 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
