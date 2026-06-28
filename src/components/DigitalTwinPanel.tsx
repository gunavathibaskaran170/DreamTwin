"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Brain,
  RefreshCw,
  ChevronRight,
  History,
  Heart,
} from "lucide-react";
import TwinAvatar from "./TwinAvatar";
import TwinChat from "./TwinChat";
import ProgressBar from "./ProgressBar";
import type { DigitalTwin } from "@/lib/types";

interface DigitalTwinPanelProps {
  twin: DigitalTwin;
  onTwinUpdate: (twin: DigitalTwin) => void;
}

export default function DigitalTwinPanel({ twin, onTwinUpdate }: DigitalTwinPanelProps) {
  const [syncing, setSyncing] = useState(false);
  const [showEvolution, setShowEvolution] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/twin/sync", { method: "POST" });
      const data = await res.json();
      if (data.twin) onTwinUpdate(data.twin);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="glass rounded-3xl p-6 dream-glow border-dream-500/20">
      <div className="flex items-start gap-4 mb-5">
        <TwinAvatar avatar={twin.avatar} syncLevel={twin.syncLevel} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-dream-400" />
            <h2 className="font-semibold text-lg truncate">{twin.twinName}</h2>
          </div>
          <p className="text-xs text-dream-300/80 mt-0.5">{twin.tagline}</p>
          <p className="text-xs text-white/40 mt-1">
            Digital twin of <span className="text-white/60">{twin.name}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          title="Sync twin with latest dreams"
          className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-dream-500/30 transition-colors shrink-0"
        >
          <RefreshCw className={`w-4 h-4 text-white/60 ${syncing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="mb-4">
        <ProgressBar progress={twin.syncLevel} size="sm" />
        <p className="text-[10px] text-white/30 mt-1">
          Sync level — how aligned your twin is with your aspirations
        </p>
      </div>

      <p className="text-sm text-white/70 leading-relaxed mb-4">
        {twin.aspirationSummary}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {twin.coreValues.map((v) => (
          <span
            key={v}
            className="text-[10px] px-2 py-0.5 rounded-full bg-dream-500/15 text-dream-300 border border-dream-500/20"
          >
            {v}
          </span>
        ))}
        {twin.traits.map((t) => (
          <span
            key={t.name}
            className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/10"
          >
            {t.name}: {t.value}
          </span>
        ))}
      </div>

      <div className="border-t border-white/10 pt-4 mb-4">
        <h3 className="text-xs font-medium text-white/50 mb-3 flex items-center gap-1.5">
          <Heart className="w-3 h-3 text-dream-400" />
          Talk to your twin
        </h3>
        <TwinChat twin={twin} onTwinUpdate={onTwinUpdate} compact />
      </div>

      <button
        type="button"
        onClick={() => setShowEvolution(!showEvolution)}
        className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition-colors mb-2"
      >
        <History className="w-3 h-3" />
        Evolution log ({twin.evolutionLog.length})
        <ChevronRight
          className={`w-3 h-3 transition-transform ${showEvolution ? "rotate-90" : ""}`}
        />
      </button>

      {showEvolution && (
        <div className="space-y-2 max-h-32 overflow-y-auto mb-3">
          {[...twin.evolutionLog].reverse().slice(0, 5).map((entry, i) => (
            <div key={i} className="text-[10px] text-white/40 border-l-2 border-dream-500/30 pl-2">
              <span className="text-white/30">
                {new Date(entry.timestamp).toLocaleDateString()}
              </span>
              {" — "}
              {entry.summary}
            </div>
          ))}
        </div>
      )}

      <Link
        href="/twin"
        className="flex items-center justify-center gap-1.5 text-xs text-dream-400 hover:text-dream-300 transition-colors pt-2 border-t border-white/10"
      >
        Full twin profile <ChevronRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
