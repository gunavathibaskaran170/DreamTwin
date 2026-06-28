"use client";

import Link from "next/link";
import { ArrowLeft, Brain, History } from "lucide-react";
import TwinAvatar from "@/components/TwinAvatar";
import TwinChat from "@/components/TwinChat";
import ProgressBar from "@/components/ProgressBar";
import StyleSelector from "@/components/StyleSelector";
import type { DigitalTwin, PersonaStyle } from "@/lib/types";
import { useState } from "react";

interface TwinProfileProps {
  initialTwin: DigitalTwin;
}

export default function TwinProfile({ initialTwin }: TwinProfileProps) {
  const [twin, setTwin] = useState(initialTwin);
  const [style, setStyle] = useState<PersonaStyle>(twin.preferredStyle);

  const saveStyle = async () => {
    const res = await fetch("/api/twin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferredStyle: style }),
    });
    const data = await res.json();
    if (data.twin) setTwin(data.twin);
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 bg-midnight-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="p-2 rounded-xl glass hover:border-dream-500/30 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-semibold flex items-center gap-2">
              <Brain className="w-4 h-4 text-dream-400" />
              {twin.twinName}
            </h1>
            <p className="text-xs text-white/40">Digital Twin Profile</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="glass rounded-3xl p-6 text-center dream-glow">
              <TwinAvatar avatar={twin.avatar} syncLevel={twin.syncLevel} size="lg" />
              <h2 className="text-xl font-bold mt-4 gradient-text">{twin.twinName}</h2>
              <p className="text-sm text-white/50 mt-1">{twin.tagline}</p>
              <p className="text-xs text-white/30 mt-2">
                Mirroring <span className="text-dream-300">{twin.name}</span>
              </p>
              <div className="mt-4">
                <ProgressBar progress={twin.syncLevel} />
              </div>
            </div>

            <div className="glass rounded-2xl p-5">
              <h3 className="font-medium mb-3 text-sm">Aspiration Mirror</h3>
              <p className="text-sm text-white/70 leading-relaxed">{twin.aspirationSummary}</p>
            </div>

            <div className="glass rounded-2xl p-5">
              <h3 className="font-medium mb-3 text-sm">Core Values</h3>
              <div className="flex flex-wrap gap-2">
                {twin.coreValues.map((v) => (
                  <span
                    key={v}
                    className="text-xs px-3 py-1 rounded-full bg-dream-500/15 text-dream-300 border border-dream-500/20"
                  >
                    {v}
                  </span>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-5">
              <h3 className="font-medium mb-3 text-sm">Learned Traits</h3>
              <div className="grid grid-cols-2 gap-2">
                {twin.traits.map((t) => (
                  <div key={t.name} className="bg-white/5 rounded-xl p-3">
                    <p className="text-[10px] text-white/40">{t.name}</p>
                    <p className="text-sm font-medium">{t.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-5">
              <h3 className="font-medium mb-3 text-sm">Communication Style</h3>
              <StyleSelector value={style} onChange={setStyle} />
              <button
                type="button"
                onClick={saveStyle}
                className="mt-3 w-full py-2 text-sm bg-dream-600/80 rounded-xl hover:bg-dream-500 transition-colors"
              >
                Update Style
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass rounded-2xl p-5">
              <h3 className="font-medium mb-4">Chat with Your Twin</h3>
              <TwinChat twin={twin} onTwinUpdate={setTwin} />
            </div>

            <div className="glass rounded-2xl p-5">
              <h3 className="font-medium mb-3 flex items-center gap-2 text-sm">
                <History className="w-4 h-4 text-dream-400" />
                Evolution Log
              </h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {[...twin.evolutionLog].reverse().map((entry, i) => (
                  <div
                    key={i}
                    className="border-l-2 border-dream-500/30 pl-3 py-1"
                  >
                    <p className="text-[10px] text-white/30">
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                    <p className="text-xs text-white/60 mt-0.5">{entry.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
