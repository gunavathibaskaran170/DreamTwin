"use client";

import clsx from "clsx";
import type { PersonaStyle } from "@/lib/types";

const STYLES: { id: PersonaStyle; label: string; emoji: string; desc: string }[] = [
  { id: "concise", label: "Concise", emoji: "📋", desc: "Bullet points, direct action" },
  { id: "narrative", label: "Narrative", emoji: "📖", desc: "Story-driven journey" },
  { id: "motivational", label: "Motivational", emoji: "🔥", desc: "High energy & encouragement" },
];

interface StyleSelectorProps {
  value: PersonaStyle;
  onChange: (style: PersonaStyle) => void;
  disabled?: boolean;
}

export default function StyleSelector({ value, onChange, disabled }: StyleSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {STYLES.map((style) => (
        <button
          key={style.id}
          type="button"
          disabled={disabled}
          onClick={() => onChange(style.id)}
          className={clsx(
            "p-3 rounded-xl border text-left transition-all duration-200",
            value === style.id
              ? "border-dream-500 bg-dream-500/20 dream-glow"
              : "border-white/10 bg-white/5 hover:border-dream-500/40 hover:bg-dream-500/10",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <span className="text-lg">{style.emoji}</span>
          <p className="text-xs font-medium mt-1">{style.label}</p>
          <p className="text-[10px] text-white/40 mt-0.5 hidden sm:block">{style.desc}</p>
        </button>
      ))}
    </div>
  );
}
