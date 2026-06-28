"use client";

import clsx from "clsx";
import { Sparkles, Compass, Star, Flame } from "lucide-react";
import type { TwinAvatar as TwinAvatarType } from "@/lib/types";

const AVATAR_CONFIG: Record<
  TwinAvatarType,
  { icon: React.ElementType; gradient: string; glow: string }
> = {
  spark: {
    icon: Sparkles,
    gradient: "from-dream-400 to-dream-600",
    glow: "shadow-dream-500/40",
  },
  compass: {
    icon: Compass,
    gradient: "from-blue-400 to-cyan-500",
    glow: "shadow-blue-500/40",
  },
  star: {
    icon: Star,
    gradient: "from-amber-400 to-orange-500",
    glow: "shadow-amber-500/40",
  },
  flame: {
    icon: Flame,
    gradient: "from-rose-400 to-red-500",
    glow: "shadow-rose-500/40",
  },
};

interface TwinAvatarProps {
  avatar: TwinAvatarType;
  syncLevel: number;
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
}

export default function TwinAvatar({
  avatar,
  syncLevel,
  size = "md",
  pulse = true,
}: TwinAvatarProps) {
  const config = AVATAR_CONFIG[avatar];
  const Icon = config.icon;

  const sizes = {
    sm: { outer: "w-12 h-12", inner: "w-10 h-10", icon: "w-5 h-5", ring: "w-14 h-14" },
    md: { outer: "w-16 h-16", inner: "w-14 h-14", icon: "w-7 h-7", ring: "w-20 h-20" },
    lg: { outer: "w-24 h-24", inner: "w-20 h-20", icon: "w-10 h-10", ring: "w-28 h-28" },
  };

  const s = sizes[size];

  return (
    <div className="relative flex items-center justify-center group/avatar cursor-pointer">
      <div className="absolute bottom-full mb-2.5 hidden group-hover/avatar:block bg-midnight-800/95 border border-dream-500/30 text-white text-[10px] rounded-xl p-2.5 w-48 text-center shadow-xl backdrop-blur-md z-50 pointer-events-none">
        <p className="font-semibold text-dream-300">Sync Level: {syncLevel}%</p>
        <p className="text-white/60 mt-0.5 leading-normal">
          Reflects how aligned your twin is. Capture dreams and complete milestones to increase alignment!
        </p>
      </div>

      <svg
        className={clsx("absolute -rotate-90 transition-transform duration-300 group-hover/avatar:scale-105", s.ring)}
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="4"
        />
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke="url(#syncGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${syncLevel * 2.89} 289`}
          className="transition-all duration-1000"
        />
        <defs>
          <linearGradient id="syncGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </svg>

      <div
        className={clsx(
          s.outer,
          "rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg",
          config.gradient,
          config.glow,
          pulse && syncLevel > 0 && "animate-pulse-slow"
        )}
      >
        <div
          className={clsx(
            s.inner,
            "rounded-full bg-midnight-900/30 backdrop-blur flex items-center justify-center"
          )}
        >
          <Icon className={clsx(s.icon, "text-white")} />
        </div>
      </div>
    </div>
  );
}
