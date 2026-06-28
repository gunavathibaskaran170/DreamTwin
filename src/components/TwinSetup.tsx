"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import clsx from "clsx";
import StyleSelector from "./StyleSelector";
import TwinAvatar from "./TwinAvatar";
import type { CreateTwinInput, PersonaStyle, TwinAvatar as TwinAvatarType } from "@/lib/types";
import { synth } from "@/lib/synth-audio";

const AVATAR_OPTIONS: { id: TwinAvatarType; label: string }[] = [
  { id: "spark", label: "Spark" },
  { id: "compass", label: "Compass" },
  { id: "star", label: "Star" },
  { id: "flame", label: "Flame" },
];

interface TwinSetupProps {
  onComplete: () => void;
}

export default function TwinSetup({ onComplete }: TwinSetupProps) {
  const [name, setName] = useState("");
  const [twinName, setTwinName] = useState("");
  const [avatar, setAvatar] = useState<TwinAvatarType>("spark");
  const [style, setStyle] = useState<PersonaStyle>("motivational");
  const [values, setValues] = useState("Growth, Purpose, Persistence");
  const [loading, setLoading] = useState(false);

  const handleSkip = async () => {
    setLoading(true);
    synth.playSuccess();
    try {
      const input: CreateTwinInput = {
        name: "Dreamer",
        twinName: "Cyber Twin",
        avatar: "spark",
        preferredStyle: "motivational",
        coreValues: ["Growth", "Purpose", "Persistence"],
      };

      await fetch("/api/twin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      onComplete();
    } catch (e) {
      console.error("Skip twin setup failed", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    synth.playSuccess();

    try {
      const input: CreateTwinInput = {
        name: name.trim(),
        twinName: twinName.trim() || undefined,
        avatar,
        preferredStyle: style,
        coreValues: values.split(",").map((v) => v.trim()).filter(Boolean),
      };

      await fetch("/api/twin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      onComplete();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight-900/90 backdrop-blur-sm">
      <div className="glass rounded-3xl p-8 max-w-lg w-full dream-glow border-dream-500/20 max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <TwinAvatar avatar={avatar} syncLevel={10} size="lg" pulse={false} />
          <h2 className="text-xl font-bold mt-4 gradient-text">Create Your Digital Twin</h2>
          <p className="text-sm text-white/50 mt-1">
            Your twin mirrors your aspirations, learns as you grow, and guides your journey.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/40 mb-1 block">Your name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex"
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-dream-500/50"
            />
          </div>

          <div>
            <label className="text-xs text-white/40 mb-1 block">Twin name (optional)</label>
            <input
              value={twinName}
              onChange={(e) => setTwinName(e.target.value)}
              placeholder={`${name || "Your"}'s DreamTwin`}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-dream-500/50"
            />
          </div>

          <div>
            <label className="text-xs text-white/40 mb-2 block">Avatar</label>
            <div className="grid grid-cols-4 gap-2">
              {AVATAR_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAvatar(opt.id)}
                  className={clsx(
                    "p-2 rounded-xl border text-center transition-all",
                    avatar === opt.id
                      ? "border-dream-500 bg-dream-500/20"
                      : "border-white/10 hover:border-dream-500/40"
                  )}
                >
                  <TwinAvatar avatar={opt.id} syncLevel={50} size="sm" pulse={false} />
                  <p className="text-[10px] mt-1">{opt.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-white/40 mb-1 block">Core values (comma-separated)</label>
            <input
              value={values}
              onChange={(e) => setValues(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-dream-500/50"
            />
          </div>

          <div>
            <label className="text-xs text-white/40 mb-2 block">Twin communication style</label>
            <StyleSelector value={style} onChange={setStyle} />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!name.trim() || loading}
          className={clsx(
            "w-full mt-6 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all cursor-pointer",
            name.trim() && !loading
              ? "bg-gradient-to-r from-dream-600 to-dream-500 text-white shadow-lg shadow-dream-500/25"
              : "bg-white/5 text-white/30 cursor-not-allowed"
          )}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Awaken My Digital Twin
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleSkip}
          disabled={loading}
          className="w-full mt-3 py-2 rounded-xl text-xs font-medium text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent hover:border-white/10 transition-all cursor-pointer text-center"
        >
          Skip & Awaken Default Cyber-Twin
        </button>
      </div>
    </div>
  );
}
