"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  Target,
  RefreshCw,
  Brain,
  X,
  AlertTriangle,
  Volume2,
  VolumeX,
  MessageSquare,
  ListTodo,
  HelpCircle,
  Loader2,
  CheckCircle2,
  Circle,
  ArrowRight,
  Shield,
  Coins,
  Activity,
  ShoppingBag,
  Terminal,
  ChevronRight,
  Plus
} from "lucide-react";
import clsx from "clsx";
import Robot3D from "./Robot3D";
import DreamCapture from "./DreamCapture";
import TwinSetup from "./TwinSetup";
import TwinChat from "./TwinChat";
import { synth } from "@/lib/synth-audio";
import type { DashboardStats, DigitalTwin, Dream, InputType, PersonaStyle } from "@/lib/types";

interface DashboardProps {
  initialDreams: Dream[];
  initialStats: DashboardStats;
  initialTwin: DigitalTwin | null;
}

interface ShopItem {
  id: string;
  name: string;
  cost: number;
  color: string;
  skinId: string;
}

const SHOP_ITEMS: ShopItem[] = [
  { id: "matrix", name: "Matrix Green Visor", cost: 150, color: "text-[#39ff14] border-[#39ff14]/30 bg-[#39ff14]/5", skinId: "matrix" },
  { id: "vaporwave", name: "Vaporwave Pink Visor", cost: 300, color: "text-[#ff007f] border-[#ff007f]/30 bg-[#ff007f]/5", skinId: "vaporwave" },
  { id: "solar", name: "Solar Flare Gold Visor", cost: 450, color: "text-[#ff7700] border-[#ff7700]/30 bg-[#ff7700]/5", skinId: "solar" }
];

export default function Dashboard({
  initialDreams,
  initialStats,
  initialTwin,
}: DashboardProps) {
  const [dreams, setDreams] = useState<any[]>([]);
  const [stats, setStats] = useState(initialStats);
  const [twin, setTwin] = useState<DigitalTwin | null>(initialTwin);
  const [showSetup, setShowSetup] = useState(!initialTwin);
  const [loading, setLoading] = useState(false);

  const [hasApiKey, setHasApiKey] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsKey, setSettingsKey] = useState("");
  const [deletingDreamId, setDeletingDreamId] = useState<string | null>(null);

  // Minimal HUD States
  const [selectedDream, setSelectedDream] = useState<Dream | null>(initialDreams[0] || null);
  const [hudTab, setHudTab] = useState<"chat" | "shop" | "terminal">("chat");
  const [isMuted, setIsMuted] = useState(false);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [twinAdvice, setTwinAdvice] = useState<string | null>(null);

  // RPG Gameplay Loop States (Persisted in LocalStorage)
  const [xp, setXp] = useState(0);
  const [gold, setGold] = useState(100);
  const [rpgLevel, setRpgLevel] = useState(1);
  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(["default"]);
  const [activeSkin, setActiveSkin] = useState("default");

  // Agentic Sub-Agent States
  const [plannerStatus, setPlannerStatus] = useState<"IDLE" | "THINKING" | "ACTIVE">("IDLE");
  const [motivatorStatus, setMotivatorStatus] = useState<"IDLE" | "THINKING" | "ACTIVE">("IDLE");
  const [syncStatus, setSyncStatus] = useState<"IDLE" | "THINKING" | "ACTIVE">("IDLE");
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "RPG Quest Hub initialized. Commander Online.",
    "Awaiting quest line registration..."
  ]);

  const processDreams = (rawDreams: Dream[]) => {
    return rawDreams.map(d => {
      const mc = d.roadmap?.milestones.length || 0;
      const difficulty = mc <= 3 ? "Easy" : mc <= 5 ? "Medium" : "Hard";
      return { ...d, difficulty };
    });
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTerminalLogs((prev) => [...prev, `[${timestamp}] ${message}`].slice(-6));
  };

  const checkSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      setHasApiKey(data.hasApiKey);
    } catch (e) {
      console.error(e);
    }
  };

  // Load RPG game state and process initial dreams
  useEffect(() => {
    setDreams(processDreams(initialDreams));
    checkSettings();
    setIsMuted(synth.isMuted());

    if (typeof window !== "undefined") {
      const savedXp = localStorage.getItem("rpg_xp");
      const savedGold = localStorage.getItem("rpg_gold");
      const savedLevel = localStorage.getItem("rpg_level");
      const savedSkins = localStorage.getItem("rpg_skins");
      const savedActiveSkin = localStorage.getItem("rpg_active_skin");

      if (savedXp) setXp(parseInt(savedXp));
      if (savedGold) setGold(parseInt(savedGold));
      if (savedLevel) setRpgLevel(parseInt(savedLevel));
      if (savedSkins) setUnlockedSkins(JSON.parse(savedSkins));
      if (savedActiveSkin) setActiveSkin(savedActiveSkin);
    }
  }, [initialDreams]);

  const updateRpgState = (newXp: number, newGold: number, newLevel: number) => {
    setXp(newXp);
    setGold(newGold);
    setRpgLevel(newLevel);
    localStorage.setItem("rpg_xp", newXp.toString());
    localStorage.setItem("rpg_gold", newGold.toString());
    localStorage.setItem("rpg_level", newLevel.toString());
  };

  const refresh = async () => {
    const [dreamsRes, twinRes] = await Promise.all([
      fetch("/api/dreams"),
      fetch("/api/twin"),
    ]);
    const dreamsData = await dreamsRes.json();
    const twinData = await twinRes.json();
    const processedDreams = processDreams(dreamsData.dreams);
    
    setDreams(processedDreams);
    setStats(dreamsData.stats);
    if (twinData.twin) setTwin(twinData.twin);

    if (selectedDream) {
      const updated = processedDreams.find((d: Dream) => d.id === selectedDream.id);
      setSelectedDream(updated || processedDreams[0] || null);
    } else {
      setSelectedDream(processedDreams[0] || null);
    }
  };

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

  const toggleMute = () => {
    const nextMute = !isMuted;
    synth.setMuted(nextMute);
    setIsMuted(nextMute);
    if (nextMute) {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } else {
      synth.playClick();
    }
  };

  const handleCapture = async (captureData: {
    rawInput: string;
    inputType: InputType;
    personaStyle: PersonaStyle;
    sketchData?: string;
  }) => {
    setLoading(true);
    setPlannerStatus("THINKING");
    addLog(`[Quest Deck] Launching constructor (Type: ${captureData.inputType}).`);
    synth.playPlanner();

    try {
      const createRes = await fetch("/api/dreams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(captureData),
      });
      const newDream = await createRes.json();
      addLog(`[Planner] Quest structured: "${newDream.title}". Generating quest line milestones.`);

      await fetch(`/api/dreams/${newDream.id}/expand`, { method: "POST" });
      addLog(`[Planner] Milestones registered successfully.`);
      setPlannerStatus("IDLE");

      setMotivatorStatus("THINKING");
      synth.playMotivator();
      addLog(`[Motivator] Injecting traits for archetype matching.`);
      await fetch(`/api/dreams/${newDream.id}/refine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style: captureData.personaStyle }),
      });
      addLog(`[Motivator] Traits aligned. Guidance active.`);
      setMotivatorStatus("IDLE");

      setSyncStatus("ACTIVE");
      synth.playSync();
      addLog(`[Sync Engine] Initializing database synchronization...`);
      await refresh();
      addLog(`[Sync Engine] Synchronization completed successfully.`);
      setSyncStatus("IDLE");

      synth.playSuccess();
      speakText("Quest Campaign created. Select mission to begin.");
    } finally {
      setLoading(false);
      setPlannerStatus("IDLE");
      setMotivatorStatus("IDLE");
      setSyncStatus("IDLE");
    }
  };

  const handleDelete = (id: string) => {
    synth.playClick();
    setDeletingDreamId(id);
  };

  const confirmDelete = async () => {
    if (!deletingDreamId) return;
    synth.playClick();
    addLog(`[Quest Deck] Abandoning active campaign...`);
    await fetch(`/api/dreams/${deletingDreamId}`, { method: "DELETE" });
    setDeletingDreamId(null);
    await refresh();
    synth.playSuccess();
    addLog(`[System] Campaign abandoned. Alignment metrics penalised.`);
  };

  const handleToggleMilestone = async (dreamId: string, milestoneId: string) => {
    synth.playClick();
    setSyncStatus("ACTIVE");
    addLog(`[Sync Engine] Calibrating milestone completion vector...`);

    const res = await fetch(`/api/dreams/${dreamId}/milestone`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ milestoneId }),
    });
    const updated = await res.json();
    await refresh();

    const m = updated.roadmap?.milestones.find((x: any) => x.id === milestoneId);
    if (m?.completed) {
      let nextXp = xp + 150;
      let nextGold = gold + 50;
      let nextLevel = rpgLevel;
      addLog(`[Loot] Secured objective! Gained +150 XP and +50 Cyber-Gold.`);

      if (nextXp >= 1000) {
        nextXp = nextXp - 1000;
        nextLevel += 1;
        synth.playLevelUp();
        addLog(`[Level Up] CONGRATULATIONS! Advanced to Level ${nextLevel}!`);
        speakText(`Congratulations! Level Up! Advanced to Level ${nextLevel}. Sync multiplier increased.`);
      } else {
        synth.playSuccess();
        speakText("Objective secured.");
      }
      updateRpgState(nextXp, nextGold, nextLevel);
    } else {
      let nextXp = Math.max(0, xp - 150);
      let nextGold = Math.max(0, gold - 50);
      addLog(`[System] Objective node retracted. Penalized 150 XP and 50 Cyber-Gold.`);
      updateRpgState(nextXp, nextGold, rpgLevel);
    }

    setSyncStatus("IDLE");
  };

  const askAdvice = async () => {
    if (!selectedDream || !twin) return;
    setAdviceLoading(true);
    setMotivatorStatus("THINKING");
    addLog(`[Motivator] Contacting Future Self database for advice...`);
    synth.playScan();
    try {
      const res = await fetch("/api/twin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Give me a quick 1-sentence motivation for my quest: "${selectedDream.title}"`,
        }),
      });
      const data = await res.json();
      setTwinAdvice(data.reply);
      addLog(`[Motivator] Voice response generated: "${data.reply?.slice(0, 30)}..."`);
      speakText(data.reply);
    } finally {
      setAdviceLoading(false);
      setMotivatorStatus("IDLE");
    }
  };

  const buySkin = (item: ShopItem) => {
    if (unlockedSkins.includes(item.skinId)) {
      synth.playClick();
      setActiveSkin(item.skinId);
      localStorage.setItem("rpg_active_skin", item.skinId);
      addLog(`[System] Equipped cosmetic visor theme: ${item.name}.`);
      return;
    }

    if (gold < item.cost) {
      synth.playClick();
      addLog(`[Shop] Failed transaction. Insufficient Cyber-Gold.`);
      return;
    }

    synth.playRegister();
    const nextGold = gold - item.cost;
    const nextSkins = [...unlockedSkins, item.skinId];
    setGold(nextGold);
    setUnlockedSkins(nextSkins);
    setActiveSkin(item.skinId);

    localStorage.setItem("rpg_gold", nextGold.toString());
    localStorage.setItem("rpg_skins", JSON.stringify(nextSkins));
    localStorage.setItem("rpg_active_skin", item.skinId);

    addLog(`[Shop] Unlocked cosmetic theme: ${item.name} for ${item.cost} G.`);
  };

  const handleTwinCreated = async () => {
    setShowSetup(false);
    await refresh();
    synth.playSuccess();
  };

  const getCharClass = () => {
    const av = twin?.avatar || "spark";
    if (av === "spark") return "Aether Technomancer";
    if (av === "compass") return "Quantum Pathfinder";
    if (av === "star") return "Solarium Knight";
    return "Chrono Cyber-Rogue";
  };

  const saveSettings = async () => {
    synth.playClick();
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: settingsKey }),
      });
      const data = await res.json();
      setHasApiKey(data.hasApiKey);
      setShowSettings(false);
      setSettingsKey("");
      await refresh();
      synth.playSuccess();
    } catch {
      alert("Failed to save settings.");
    }
  };

  const clearSettings = async () => {
    synth.playClick();
    try {
      const res = await fetch("/api/settings", { method: "DELETE" });
      const data = await res.json();
      setHasApiKey(data.hasApiKey);
      setShowSettings(false);
      setSettingsKey("");
      await refresh();
      synth.playSuccess();
    } catch {
      alert("Failed to clear settings.");
    }
  };

  const completedDreams = stats.totalDreams - stats.activeDreams;
  const attrFocus = Math.min(100, Math.floor(completedDreams * 15 + rpgLevel * 5));
  const attrGrit = Math.min(100, Math.floor(stats.totalMilestones * 4 + rpgLevel * 8));
  const attrLogic = Math.min(100, Math.floor((stats.completedMilestones / Math.max(1, stats.totalMilestones)) * 60 + rpgLevel * 10));

  const selectedDifficulty = selectedDream ? (dreams.find((d) => d.id === selectedDream.id)?.difficulty || "Easy") : "Easy";

  const syncLevel = twin ? twin.syncLevel : 10;
  const robotState = loading || adviceLoading ? "thinking" : hudTab === "chat" && loading ? "speaking" : "idle";

  return (
    <div className="min-h-screen bg-[#07050e] text-white/90 relative scanlines flex flex-col font-sans">
      {showSetup && <TwinSetup onComplete={handleTwinCreated} />}

      {/* Cyber Header */}
      <header className="border-b border-dream-500/10 bg-black/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-dream-500 to-dream-700 flex items-center justify-center border border-dream-400/30">
              <Shield className="w-4.5 h-4.5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wider uppercase text-dream-300">RPG Agentic Deck</h1>
              <p className="text-[9px] text-white/30 tracking-widest font-mono">PORTAL SIMULATOR v4.1</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-amber-400">
              <Coins className="w-3.5 h-3.5" />
              <span>{gold} G</span>
            </div>

            <button
              type="button"
              onClick={toggleMute}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-dream-500/30 transition-all cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-white/40" /> : <Volume2 className="w-4 h-4 text-dream-400 animate-pulse" />}
            </button>

            <button
              type="button"
              onClick={() => { synth.playClick(); setShowSettings(true); }}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer uppercase tracking-wider",
                hasApiKey
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-400"
              )}
            >
              <span className={clsx("w-1.5 h-1.5 rounded-full animate-pulse", hasApiKey ? "bg-emerald-400" : "bg-amber-400")} />
              {hasApiKey ? "AI Connected" : "Demo Mode"}
            </button>

            <button
              type="button"
              onClick={() => { synth.playClick(); refresh(); }}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-dream-500/30 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </div>
      </header>

      {/* Main 3-Column RPG Interface */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full grid lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Character Stats Sheet */}
        <section className="lg:col-span-4 flex flex-col justify-between cyber-panel p-5 bg-gradient-to-b from-midnight-900/40 to-black/25">
          <div className="space-y-4">
            <div className="border-b border-white/5 pb-3">
              <h3 className="text-[10px] font-mono tracking-widest text-white/30 uppercase">Commander Character</h3>
              <h2 className="text-base font-extrabold uppercase text-dream-300 mt-0.5">{getCharClass()}</h2>
              <p className="text-[9px] text-white/40 mt-0.5 font-mono">Sync level alignment: {syncLevel}%</p>
            </div>

            {/* 3D wireframe avatar stage */}
            <div className="relative py-2 w-full flex flex-col items-center border border-white/5 rounded-2xl bg-black/40">
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-dream-500/10 border border-dream-500/20 text-[8px] font-mono text-dream-400 uppercase tracking-widest">
                LVL {rpgLevel}
              </div>
              <Robot3D avatar={twin?.avatar || "spark"} syncLevel={syncLevel} state={robotState} skin={activeSkin} />
              
              <div className="w-[85%] mt-2 mb-3">
                <div className="flex justify-between text-[9px] font-mono text-white/50 mb-1">
                  <span>EXP PROGRESS</span>
                  <span>{xp}/1000 XP</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 border border-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-dream-500 to-dream-300 transition-all duration-300" style={{ width: `${(xp / 1000) * 100}%` }} />
                </div>
              </div>
            </div>

            {/* Attributes Grid */}
            <div className="space-y-2.5">
              <h4 className="text-[10px] font-mono tracking-widest text-white/30 uppercase">Attributes Grid</h4>
              {[
                { name: "Focus (Vision)", value: attrFocus, color: "bg-blue-400" },
                { name: "Grit (Action)", value: attrGrit, color: "bg-amber-400" },
                { name: "Logic (Planning)", value: attrLogic, color: "bg-emerald-400" }
              ].map((attr) => (
                <div key={attr.name} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-semibold">
                    <span>{attr.name}</span>
                    <span className="font-mono text-white/50">{attr.value}%</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className={clsx("h-full rounded-full transition-all duration-300", attr.color)} style={{ width: `${attr.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/5">
            <h4 className="text-[10px] font-mono tracking-widest text-white/30 uppercase mb-2">Simulated Sub-Agents</h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { name: "Planner", status: plannerStatus, color: "bg-blue-400" },
                { name: "Motivator", status: motivatorStatus, color: "bg-amber-400" },
                { name: "Sync Engine", status: syncStatus, color: "bg-emerald-400" }
              ].map((agent) => (
                <div key={agent.name} className="glass rounded-xl p-2 border border-white/5 text-center relative overflow-hidden">
                  <span className={clsx(
                    "absolute top-1 right-1 w-1 h-1 rounded-full",
                    agent.status === "ACTIVE" ? "bg-cyan-400 animate-ping" :
                    agent.status === "THINKING" ? "bg-purple-400 animate-pulse" : "bg-white/10"
                  )} />
                  <p className="text-[8px] font-bold uppercase tracking-wider text-white truncate">{agent.name}</p>
                  <span className={clsx(
                    "text-[8px] font-mono mt-1.5 inline-block px-1.5 py-0.5 rounded",
                    agent.status === "ACTIVE" ? "bg-cyan-500/10 text-cyan-400" :
                    agent.status === "THINKING" ? "bg-purple-500/10 text-purple-400" : "bg-white/5 text-white/40"
                  )}>
                    {agent.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Center Column: Quest Board */}
        <section className="lg:col-span-5 flex flex-col justify-between cyber-panel p-5 bg-gradient-to-b from-midnight-900/35 to-black/20">
          <div className="space-y-4">
            
            <div className="border-b border-white/5 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-[10px] font-mono tracking-widest text-white/30 uppercase">Campaigns</h3>
                <h2 className="text-base font-bold uppercase text-white mt-0.5">Active Mission Board</h2>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2 overflow-x-auto pb-1.5 max-w-full scrollbar-none">
                {dreams.map((dream) => {
                  const isSelected = selectedDream?.id === dream.id;
                  return (
                    <button
                      key={dream.id}
                      type="button"
                      onClick={() => { synth.playClick(); setSelectedDream(dream); }}
                      className={clsx(
                        "px-3 py-2 rounded-xl border text-[10px] font-bold text-left shrink-0 transition-all cursor-pointer max-w-[140px] truncate",
                        isSelected
                          ? "bg-dream-500/20 border-dream-500 text-white"
                          : "bg-white/5 border-white/10 text-white/50 hover:border-white/20"
                      )}
                    >
                      🛡️ {dream.title}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedDream ? (
              <div className="border border-white/5 bg-white/5 rounded-2xl p-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">{selectedDream.title}</h4>
                      <span className={clsx(
                        "text-[8px] font-mono uppercase px-1.5 py-0.5 rounded border shrink-0",
                        selectedDifficulty === "Easy" ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5" :
                        selectedDifficulty === "Medium" ? "border-amber-500/30 text-amber-400 bg-amber-500/5" :
                        "border-red-500/30 text-red-400 bg-red-500/5"
                      )}>
                        Difficulty: {selectedDifficulty}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/40 mt-1 italic">&ldquo;{selectedDream.rawInput}&rdquo;</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedDream.id)}
                    className="px-2 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-[9px] cursor-pointer"
                  >
                    Abandon
                  </button>
                </div>

                {selectedDream.roadmap ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-t border-white/5 pt-3">
                      <span className="text-[10px] font-mono text-white/40 uppercase">Quest Milestones</span>
                      <Link
                        href={`/dreams/${selectedDream.id}`}
                        className="text-[10px] font-mono text-dream-400 hover:text-dream-300 flex items-center gap-1"
                      >
                        Modify Quest <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>

                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                      {selectedDream.roadmap.milestones
                        .sort((a, b) => a.order - b.order)
                        .map((m) => (
                          <div
                            key={m.id}
                            onClick={() => handleToggleMilestone(selectedDream.id, m.id)}
                            className={clsx(
                              "flex gap-3 items-start p-2.5 rounded-xl border transition-all cursor-pointer",
                              m.completed
                                ? "bg-emerald-500/5 border-emerald-500/20 opacity-60"
                                : "bg-white/5 border-white/5 hover:border-dream-500/30"
                            )}
                          >
                            <button type="button" className="shrink-0 mt-0.5">
                              {m.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Circle className="w-4 h-4 text-white/30" />
                              )}
                            </button>
                            <div>
                              <p className={clsx("text-xs font-semibold", m.completed ? "line-through text-white/40" : "text-white/90")}>
                                {m.title}
                              </p>
                              <p className="text-[9px] text-white/40 mt-0.5 leading-normal">
                                {m.description}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 border-t border-white/5">
                    <p className="text-xs text-white/40">Expanding Quest Roadmap...</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-dashed border-white/10 rounded-2xl p-6 text-center">
                <p className="text-xs text-white/40">No active quests on simulation deck.</p>
              </div>
            )}

          </div>

          <div className="w-full border-t border-white/5 pt-4">
            <DreamCapture onCapture={handleCapture} loading={loading} />
          </div>

        </section>

        {/* Right Column: HUD Panels */}
        <section className="lg:col-span-4 flex flex-col cyber-panel bg-gradient-to-b from-midnight-900/35 to-black/30">
          
          <div className="grid grid-cols-3 border-b border-white/5">
            {[
              { id: "chat", label: "Comm", icon: MessageSquare },
              { id: "shop", label: "Shop", icon: ShoppingBag },
              { id: "terminal", label: "Logs", icon: Terminal },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = hudTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => { synth.playClick(); setHudTab(tab.id as any); }}
                  className={clsx(
                    "py-3.5 text-[10px] font-bold tracking-widest uppercase border-b-2 flex items-center justify-center gap-1.5 cursor-pointer transition-all",
                    active
                      ? "border-dream-500 text-dream-300 bg-dream-500/5"
                      : "border-transparent text-white/40 hover:text-white/70"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 p-5 overflow-y-auto">
            
            {hudTab === "chat" && twin && (
              <div className="h-full flex flex-col justify-between">
                <TwinChat
                  twin={twin}
                  onTwinUpdate={setTwin}
                  compact
                  onLog={addLog}
                  onStatus={(agent, status) => {
                    if (agent === "planner") setPlannerStatus(status);
                    if (agent === "motivator") setMotivatorStatus(status);
                    if (agent === "sync") setSyncStatus(status);
                  }}
                />
              </div>
            )}

            {hudTab === "shop" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-[10px] font-mono tracking-widest text-white/30 uppercase">Cosmetic upgrades</h3>
                  <h4 className="text-xs font-bold text-white mt-0.5">Visor Custom Skins</h4>
                  <p className="text-[9px] text-white/45 mt-1 leading-normal">
                    Unlock neon wireframe themes for your 3D Robot Twin using Cyber-Gold coins earned from completed objectives.
                  </p>
                </div>

                <div className="space-y-3.5">
                  {SHOP_ITEMS.map((item) => {
                    const isUnlocked = unlockedSkins.includes(item.skinId);
                    const isActive = activeSkin === item.skinId;
                    return (
                      <div key={item.id} className={clsx("p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all", item.color)}>
                        <div>
                          <p className="text-xs font-bold">{item.name}</p>
                          <p className="text-[9px] opacity-60 mt-0.5 font-mono">
                            {isActive ? "ACTIVE TARGET" : isUnlocked ? "UNLOCKED & EQUIP READY" : `COST: ${item.cost} G`}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => buySkin(item)}
                          disabled={!isUnlocked && gold < item.cost}
                          className={clsx(
                            "px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all cursor-pointer text-center",
                            isActive ? "bg-white/10 text-white/40 cursor-default" :
                            isUnlocked ? "bg-white/15 text-white hover:bg-white/25" :
                            gold >= item.cost ? "bg-amber-500 text-black hover:bg-amber-400 font-bold" : "bg-white/5 text-white/20 cursor-not-allowed"
                          )}
                        >
                          {isActive ? "Equipped" : isUnlocked ? "Equip" : `Buy ${item.cost}G`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {hudTab === "terminal" && (
              <div className="h-full flex flex-col justify-between font-mono text-[9px] text-emerald-400/90 space-y-3">
                <div className="flex-1 space-y-1 bg-black/60 border border-white/5 rounded-2xl p-4 h-60 overflow-y-auto">
                  <div className="text-white/20 border-b border-white/5 pb-1 mb-2 uppercase tracking-wider text-[8px] flex items-center justify-between">
                    <span>Simulation Logs Feed</span>
                    <span className="animate-pulse">● LIVE STREAM</span>
                  </div>
                  {terminalLogs.map((log, index) => (
                    <div key={index} className="leading-relaxed">
                      <span className="text-emerald-500/50">&gt; </span>
                      {log}
                    </div>
                  ))}
                </div>
                {selectedDream && (
                  <button
                    type="button"
                    onClick={askAdvice}
                    disabled={adviceLoading}
                    className="w-full py-2 rounded-xl border border-dream-500/30 bg-dream-500/10 hover:bg-dream-500/20 text-[10px] font-bold tracking-wider uppercase text-dream-300 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {adviceLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
                    Obtain Tactical Advice
                  </button>
                )}
              </div>
            )}

          </div>

        </section>

      </main>

      <footer className="border-t border-white/5 py-4 text-center text-[10px] font-mono text-white/20 tracking-wider">
        PORTAL ALIGNMENT LOCK // ENCRYPTED RPG SECTOR SECURE
      </footer>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="glass rounded-3xl p-6 max-w-md w-full border-dream-500/20 relative">
            <h3 className="font-bold text-lg mb-2 text-dream-300 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-dream-400" />
              API Deck Configuration
            </h3>
            <p className="text-xs text-white/50 mb-4 leading-relaxed">
              Add your OpenAI API Key to unlock custom generated roadmap milestone nodes and real-time Comm dialog.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-white/40 block mb-1">OpenAI API Key</label>
                <input
                  type="password"
                  value={settingsKey}
                  onChange={(e) => setSettingsKey(e.target.value)}
                  placeholder={hasApiKey ? "••••••••••••••••••••••••••••" : "sk-..."}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-dream-500/50 text-white placeholder:text-white/20"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveSettings}
                  className="flex-1 py-2.5 bg-dream-600 hover:bg-dream-500 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                >
                  Save Key
                </button>
                {hasApiKey && (
                  <button
                    type="button"
                    onClick={clearSettings}
                    className="px-4 py-2.5 bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 rounded-xl text-sm font-medium text-red-400 transition-colors cursor-pointer"
                  >
                    Clear Key
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowSettings(false);
                    if (!hasApiKey) setSettingsKey("");
                  }}
                  className="px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingDreamId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass rounded-3xl p-6 max-w-sm w-full border-red-500/20 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3 animate-bounce" />
            <h3 className="font-bold text-lg mb-2">Abandon Campaign?</h3>
            <p className="text-xs text-white/50 mb-5 leading-relaxed">
              Are you sure you want to abandon this quest campaign? All associated logs, EXP multipliers, and progression stats will be erased.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-medium transition-colors cursor-pointer animate-pulse"
              >
                Abandon
              </button>
              <button
                type="button"
                onClick={() => setDeletingDreamId(null)}
                className="flex-1 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-sm font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
