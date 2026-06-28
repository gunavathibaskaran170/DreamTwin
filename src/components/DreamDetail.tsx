"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Download,
  Loader2,
  Edit3,
  Brain,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check,
  X,
} from "lucide-react";
import RoadmapView from "@/components/RoadmapView";
import ProgressBar from "@/components/ProgressBar";
import MotivationNudge from "@/components/MotivationNudge";
import StyleSelector from "@/components/StyleSelector";
import { calculateProgress } from "@/lib/utils";
import type { DigitalTwin, Dream, PersonaStyle, Milestone, Roadmap } from "@/lib/types";
import { synth } from "@/lib/synth-audio";

interface DreamDetailProps {
  initialDream: Dream;
  initialTwin?: DigitalTwin | null;
}

export default function DreamDetail({ initialDream, initialTwin }: DreamDetailProps) {
  const [dream, setDream] = useState(initialDream);
  const [twinAdvice, setTwinAdvice] = useState<string | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [style, setStyle] = useState<PersonaStyle>(dream.personaStyle);
  const [adaptGoal, setAdaptGoal] = useState("");
  const [showAdapt, setShowAdapt] = useState(false);

  const [isEditingMilestones, setIsEditingMilestones] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [newMilestoneDesc, setNewMilestoneDesc] = useState("");
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDesc, setEditingDesc] = useState("");

  const handleAddMilestone = async () => {
    if (!newMilestoneTitle.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/dreams/${dream.id}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          title: newMilestoneTitle.trim(),
          description: newMilestoneDesc.trim(),
        }),
      });
      setDream(await res.json());
      setNewMilestoneTitle("");
      setNewMilestoneDesc("");
      synth.playSuccess();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMilestoneEdit = async (milestoneId: string) => {
    if (!editingTitle.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/dreams/${dream.id}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "edit",
          milestoneId,
          title: editingTitle.trim(),
          description: editingDesc.trim(),
        }),
      });
      setDream(await res.json());
      setEditingMilestoneId(null);
      synth.playSuccess();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    setLoading(true);
    synth.playClick();
    try {
      const res = await fetch(`/api/dreams/${dream.id}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          milestoneId,
        }),
      });
      setDream(await res.json());
      synth.playSuccess();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveMilestone = async (index: number, direction: "up" | "down") => {
    const list = [...(dream.roadmap?.milestones ?? [])].sort((a, b) => a.order - b.order);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    synth.playClick();
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    const orderedIds = list.map((m) => m.id);
    setLoading(true);
    try {
      const res = await fetch(`/api/dreams/${dream.id}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reorder",
          orderedIds,
        }),
      });
      setDream(await res.json());
      synth.playSuccess();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const progress = dream.roadmap
    ? calculateProgress(dream.roadmap.milestones)
    : 0;

  const refreshDream = async () => {
    const res = await fetch(`/api/dreams/${dream.id}`);
    setDream(await res.json());
  };

  const handleToggleMilestone = async (milestoneId: string) => {
    synth.playClick();
    const res = await fetch(`/api/dreams/${dream.id}/milestone`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ milestoneId }),
    });
    const data = await res.json();
    setDream(data);

    const m = data.roadmap?.milestones.find((x: any) => x.id === milestoneId);
    if (m?.completed) {
      synth.playSuccess();
    }
  };

  const handleRefine = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dreams/${dream.id}/refine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style }),
      });
      setDream(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const handleAdapt = async () => {
    if (!adaptGoal.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/dreams/${dream.id}/adapt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newGoal: adaptGoal }),
      });
      setDream(await res.json());
      setAdaptGoal("");
      setShowAdapt(false);
    } finally {
      setLoading(false);
    }
  };

  const handleExpand = async () => {
    setLoading(true);
    try {
      await fetch(`/api/dreams/${dream.id}/expand`, { method: "POST" });
      await refreshDream();
    } finally {
      setLoading(false);
    }
  };

  const askTwin = async () => {
    if (!initialTwin) return;
    setAdviceLoading(true);
    try {
      const res = await fetch("/api/twin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Give me advice on my dream "${dream.title}" — I'm at ${progress}% progress. What should I focus on next?`,
        }),
      });
      const data = await res.json();
      setTwinAdvice(data.reply ?? null);
    } finally {
      setAdviceLoading(false);
    }
  };

  const handleExport = () => {
    const content = [
      `# ${dream.title}`,
      "",
      `**Original Dream:** ${dream.rawInput}`,
      "",
      dream.roadmap?.summary ?? "",
      "",
      "## Milestones",
      ...(dream.roadmap?.milestones.map(
        (m, i) => `${i + 1}. [${m.completed ? "x" : " "}] ${m.title} — ${m.description}`
      ) ?? []),
      "",
      dream.refinedContent ?? "",
      "",
      `*Generated by DreamTwin on ${new Date().toLocaleDateString()}*`,
    ].join("\n");

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dreamtwin-${dream.title.slice(0, 30).replace(/\s+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 bg-midnight-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="p-2 rounded-xl glass hover:border-dream-500/30 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold truncate">{dream.title}</h1>
            <p className="text-xs text-white/40 capitalize">
              {dream.inputType} · {dream.status}
            </p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="p-2 rounded-xl glass hover:border-dream-500/30 transition-colors"
            title="Export"
          >
            <Download className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="glass rounded-2xl p-5">
          <p className="text-xs text-white/40 mb-1">Original spark</p>
          <p className="text-sm text-white/80 italic">&ldquo;{dream.rawInput}&rdquo;</p>
          {dream.sketchUrl && (
            <img
              src={dream.sketchUrl}
              alt="Dream sketch"
              className="mt-3 rounded-xl max-h-48 object-contain"
            />
          )}
        </div>

        {dream.motivationalNudge && (
          <MotivationNudge
            message={dream.motivationalNudge}
            variant={progress === 100 ? "celebration" : "default"}
          />
        )}

        {!dream.roadmap ? (
          <div className="glass rounded-2xl p-8 text-center">
            <Sparkles className="w-10 h-10 text-dream-400 mx-auto mb-4" />
            <p className="text-white/60 mb-4">This dream hasn&apos;t been expanded yet.</p>
            <button
              type="button"
              onClick={handleExpand}
              disabled={loading}
              className="px-6 py-2.5 bg-dream-600 rounded-xl text-sm font-medium hover:bg-dream-500 transition-colors disabled:opacity-50"
            >
              {loading ? "Expanding..." : "Expand into Roadmap"}
            </button>
          </div>
        ) : (
          <>
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold">{dream.roadmap.summary}</h2>
                  {dream.roadmap.estimatedDuration && (
                    <p className="text-xs text-white/40 mt-0.5">
                      Estimated: {dream.roadmap.estimatedDuration}
                    </p>
                  )}
                </div>
                <span className="text-2xl font-bold gradient-text">{progress}%</span>
              </div>
              <ProgressBar progress={progress} showLabel={false} size="lg" />
            </div>

            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-dream-400" />
                  Milestones
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditingMilestones(!isEditingMilestones)}
                  className="text-xs text-dream-400 hover:text-dream-300 flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  {isEditingMilestones ? "Done Customizing" : "Customize Milestones"}
                </button>
              </div>

              {isEditingMilestones ? (
                <div className="space-y-4">
                  <div className="space-y-3">
                    {[...(dream.roadmap?.milestones ?? [])]
                      .sort((a, b) => a.order - b.order)
                      .map((m, index, arr) => (
                        <div key={m.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-2">
                          {editingMilestoneId === m.id ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                className="w-full bg-midnight-900 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                              />
                              <textarea
                                value={editingDesc}
                                onChange={(e) => setEditingDesc(e.target.value)}
                                className="w-full bg-midnight-900 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none resize-none"
                                rows={2}
                              />
                              <div className="flex justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleSaveMilestoneEdit(m.id)}
                                  className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs flex items-center gap-1 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" /> Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingMilestoneId(null)}
                                  className="p-1.5 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 text-xs flex items-center gap-1 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" /> Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <h4 className="text-xs font-semibold text-white">{m.title}</h4>
                                <p className="text-[10px] text-white/40 mt-0.5 leading-relaxed">{m.description}</p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  disabled={index === 0}
                                  onClick={() => handleMoveMilestone(index, "up")}
                                  className="p-1 rounded bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={index === arr.length - 1}
                                  onClick={() => handleMoveMilestone(index, "down")}
                                  className="p-1 rounded bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingMilestoneId(m.id);
                                    setEditingTitle(m.title);
                                    setEditingDesc(m.description);
                                  }}
                                  className="p-1 rounded bg-white/5 border border-white/10 text-dream-400 hover:bg-white/10 cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMilestone(m.id)}
                                  className="p-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>

                  <div className="bg-white/5 border border-dashed border-white/10 rounded-xl p-3 space-y-2 mt-2">
                    <p className="text-[10px] font-semibold text-dream-300">Add custom milestone</p>
                    <input
                      type="text"
                      placeholder="Milestone title..."
                      value={newMilestoneTitle}
                      onChange={(e) => setNewMilestoneTitle(e.target.value)}
                      className="w-full bg-midnight-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-dream-500/50"
                    />
                    <input
                      type="text"
                      placeholder="Milestone description..."
                      value={newMilestoneDesc}
                      onChange={(e) => setNewMilestoneDesc(e.target.value)}
                      className="w-full bg-midnight-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-dream-500/50"
                    />
                    <button
                      type="button"
                      onClick={handleAddMilestone}
                      className="w-full py-1.5 bg-dream-600 hover:bg-dream-500 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Milestone
                    </button>
                  </div>
                </div>
              ) : (
                <RoadmapView
                  milestones={dream.roadmap.milestones}
                  onToggle={handleToggleMilestone}
                />
              )}
            </div>

            {dream.refinedContent && (
              <div className="glass rounded-2xl p-5">
                <h3 className="font-medium mb-3">Refined Roadmap</h3>
                <div className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed">
                  {dream.refinedContent}
                </div>
              </div>
            )}

            {initialTwin && dream.roadmap && (
              <div className="glass rounded-2xl p-5 border-dream-500/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <Brain className="w-4 h-4 text-dream-400" />
                    {initialTwin.twinName}&apos;s Advice
                  </h3>
                  <button
                    type="button"
                    onClick={askTwin}
                    disabled={adviceLoading}
                    className="text-xs px-3 py-1.5 rounded-lg bg-dream-600/80 hover:bg-dream-500 transition-colors disabled:opacity-50"
                  >
                    {adviceLoading ? "Thinking..." : "Ask Twin"}
                  </button>
                </div>
                {twinAdvice ? (
                  <p className="text-sm text-white/70 leading-relaxed">{twinAdvice}</p>
                ) : (
                  <p className="text-xs text-white/40">
                    Your digital twin knows this dream — ask for personalized guidance.
                  </p>
                )}
              </div>
            )}

            <div className="glass rounded-2xl p-5">
              <h3 className="font-medium mb-3">Refine Style</h3>
              <StyleSelector value={style} onChange={setStyle} disabled={loading} />
              <button
                type="button"
                onClick={handleRefine}
                disabled={loading}
                className="mt-3 w-full py-2.5 bg-dream-600/80 rounded-xl text-sm font-medium hover:bg-dream-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Re-refine Roadmap
              </button>
            </div>

            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-dream-400" />
                  Adapt Dream
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAdapt(!showAdapt)}
                  className="text-xs text-dream-400 hover:text-dream-300"
                >
                  {showAdapt ? "Cancel" : "Pivot goal"}
                </button>
              </div>
              {showAdapt && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={adaptGoal}
                    onChange={(e) => setAdaptGoal(e.target.value)}
                    placeholder="Describe how your dream has evolved..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-dream-500/50"
                  />
                  <button
                    type="button"
                    onClick={handleAdapt}
                    disabled={loading || !adaptGoal.trim()}
                    className="w-full py-2.5 bg-white/10 rounded-xl text-sm font-medium hover:bg-white/15 transition-colors disabled:opacity-50"
                  >
                    Update Roadmap
                  </button>
                </div>
              )}
              {!showAdapt && (
                <p className="text-xs text-white/40">
                  Goals evolve — pivot your roadmap when your vision changes.
                </p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
