import { getAllDreams } from "./db";
import { applyTwinSync, getTwin } from "./twin-db";
import type { DigitalTwin, Dream, TwinEvolutionEntry, TwinTrait } from "./types";
import { calculateProgress } from "./utils";

function inferTraits(dreams: Dream[]): TwinTrait[] {
  const traits: TwinTrait[] = [];
  const inputs = dreams.map((d) => d.rawInput.toLowerCase()).join(" ");

  if (inputs.match(/book|write|create|art|design|music/)) {
    traits.push({ name: "Creative", value: "Maker" });
  }
  if (inputs.match(/startup|business|company|launch|build/)) {
    traits.push({ name: "Ambition", value: "Builder" });
  }
  if (inputs.match(/fit|health|run|gym|wellness/)) {
    traits.push({ name: "Discipline", value: "Athlete" });
  }
  if (inputs.match(/learn|study|degree|course|skill/)) {
    traits.push({ name: "Curiosity", value: "Learner" });
  }

  const styles = dreams.map((d) => d.personaStyle);
  const topStyle = styles.sort(
    (a, b) => styles.filter((s) => s === b).length - styles.filter((s) => s === a).length
  )[0];

  if (topStyle === "motivational") traits.push({ name: "Energy", value: "High-drive" });
  if (topStyle === "narrative") traits.push({ name: "Vision", value: "Storyteller" });
  if (topStyle === "concise") traits.push({ name: "Focus", value: "Action-first" });

  const activeCount = dreams.filter((d) => d.status === "active" || d.status === "refined").length;
  if (activeCount >= 2) traits.push({ name: "Multitasker", value: "Juggler" });

  const completed = dreams.filter((d) => d.status === "completed").length;
  if (completed > 0) traits.push({ name: "Achiever", value: `${completed} dream${completed > 1 ? "s" : ""} done` });

  if (traits.length === 0) {
    traits.push({ name: "Mindset", value: "Dreamer" });
  }

  return traits.slice(0, 5);
}

function buildAspirationSummary(dreams: Dream[]): string {
  if (dreams.length === 0) {
    return "Your twin is waiting for your first dream to understand who you're becoming.";
  }

  const titles = dreams.slice(0, 5).map((d) => d.title);
  const active = dreams.filter((d) => d.status === "active" || d.status === "refined");
  const completed = dreams.filter((d) => d.status === "completed");

  let summary = `You're pursuing ${dreams.length} dream${dreams.length > 1 ? "s" : ""}`;
  if (titles.length > 0) {
    summary += `: ${titles.join(", ")}`;
  }
  if (active.length > 0) {
    summary += `. Currently active on ${active.length}.`;
  }
  if (completed.length > 0) {
    summary += ` Already completed ${completed.length}!`;
  }

  return summary;
}

function computeSyncLevel(dreams: Dream[]): number {
  if (dreams.length === 0) return 10;

  let level = 20;
  level += Math.min(dreams.length * 8, 32);

  const withRoadmaps = dreams.filter((d) => d.roadmap).length;
  level += Math.min(withRoadmaps * 6, 24);

  let totalProgress = 0;
  let count = 0;
  for (const dream of dreams) {
    if (dream.roadmap) {
      totalProgress += calculateProgress(dream.roadmap.milestones);
      count++;
    }
  }
  if (count > 0) {
    level += Math.round(totalProgress / count * 0.24);
  }

  return Math.min(100, Math.round(level));
}

export async function syncTwinFromDreams(
  event?: TwinEvolutionEntry["event"],
  eventSummary?: string
): Promise<DigitalTwin | null> {
  const twin = await getTwin();
  if (!twin) return null;

  const dreams = await getAllDreams();
  const aspirationSummary = buildAspirationSummary(dreams);
  const traits = inferTraits(dreams);
  const syncLevel = computeSyncLevel(dreams);

  const preferredStyle =
    dreams.length > 0
      ? dreams.reduce(
          (acc, d) => {
            acc[d.personaStyle] = (acc[d.personaStyle] ?? 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        )
      : null;

  const topStyle = preferredStyle
    ? (Object.entries(preferredStyle).sort((a, b) => b[1] - a[1])[0]?.[0] as DigitalTwin["preferredStyle"])
    : twin.preferredStyle;

  const evolutionEntry: TwinEvolutionEntry | undefined =
    event && eventSummary
      ? { timestamp: new Date().toISOString(), event, summary: eventSummary }
      : {
          timestamp: new Date().toISOString(),
          event: "sync",
          summary: `Twin synced — now ${syncLevel}% aligned with your aspirations.`,
        };

  return applyTwinSync({
    aspirationSummary,
    traits,
    syncLevel,
    preferredStyle: topStyle,
    evolutionEntry,
  });
}

export function buildTwinDreamContext(dreams: Dream[]): {
  activeDreams: string[];
  recentProgress: string;
} {
  const activeDreams = dreams
    .filter((d) => d.status === "active" || d.status === "refined" || d.status === "expanded")
    .slice(0, 5)
    .map((d) => {
      const progress = d.roadmap ? calculateProgress(d.roadmap.milestones) : 0;
      return `${d.title} (${progress}% done)`;
    });

  const recent = dreams
    .flatMap((d) =>
      (d.roadmap?.milestones ?? [])
        .filter((m) => m.completed && m.completedAt)
        .map((m) => ({ dream: d.title, milestone: m.title, at: m.completedAt! }))
    )
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 3);

  const recentProgress =
    recent.length > 0
      ? recent.map((r) => `Completed "${r.milestone}" on ${r.dream}`).join("; ")
      : "No milestones completed yet — your twin believes the first step is coming soon.";

  return { activeDreams, recentProgress };
}

export function buildFullTwinContext(
  twin: DigitalTwin,
  dreams: Dream[]
): import("./types").TwinContext {
  const dreamContext = buildTwinDreamContext(dreams);
  return {
    name: twin.name,
    twinName: twin.twinName,
    aspirationSummary: twin.aspirationSummary,
    coreValues: twin.coreValues,
    traits: twin.traits,
    preferredStyle: twin.preferredStyle,
    syncLevel: twin.syncLevel,
    activeDreams: dreamContext.activeDreams,
    recentProgress: dreamContext.recentProgress,
  };
}
