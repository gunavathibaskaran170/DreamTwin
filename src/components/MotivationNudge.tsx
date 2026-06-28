"use client";

import { Sparkles, Zap, Heart } from "lucide-react";

interface MotivationNudgeProps {
  message: string;
  variant?: "default" | "celebration";
}

export default function MotivationNudge({
  message,
  variant = "default",
}: MotivationNudgeProps) {
  const Icon = variant === "celebration" ? Heart : Sparkles;

  return (
    <div
      className={`glass rounded-2xl p-4 flex items-start gap-3 dream-glow ${
        variant === "celebration"
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-dream-500/20"
      }`}
    >
      <div
        className={`p-2 rounded-xl shrink-0 ${
          variant === "celebration" ? "bg-emerald-500/20" : "bg-dream-500/20"
        }`}
      >
        <Icon
          className={`w-4 h-4 ${
            variant === "celebration" ? "text-emerald-400" : "text-dream-400"
          }`}
        />
      </div>
      <div>
        <p className="text-xs font-medium text-dream-300 mb-1 flex items-center gap-1">
          <Zap className="w-3 h-3" />
          DreamTwin Nudge
        </p>
        <p className="text-sm text-white/80 leading-relaxed">{message}</p>
      </div>
    </div>
  );
}
