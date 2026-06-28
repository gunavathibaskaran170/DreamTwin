import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import type {
  AdaptDreamInput,
  CreateDreamInput,
  DashboardStats,
  Dream,
  Milestone,
  PersonaStyle,
  Roadmap,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "dreams.json");

async function ensureDataFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2));
  }
}

async function readDreams(): Promise<Dream[]> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  return JSON.parse(raw) as Dream[];
}

async function writeDreams(dreams: Dream[]): Promise<void> {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(dreams, null, 2));
}

export async function getAllDreams(): Promise<Dream[]> {
  const dreams = await readDreams();
  return dreams.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function getDreamById(id: string): Promise<Dream | null> {
  const dreams = await readDreams();
  return dreams.find((d) => d.id === id) ?? null;
}

function extractTitle(rawInput: string): string {
  const cleaned = rawInput.trim().replace(/\s+/g, " ");
  if (cleaned.length <= 60) return cleaned;
  return cleaned.slice(0, 57) + "...";
}

export async function createDream(input: CreateDreamInput): Promise<Dream> {
  const dreams = await readDreams();
  const now = new Date().toISOString();

  const dream: Dream = {
    id: uuidv4(),
    title: extractTitle(input.rawInput),
    rawInput: input.rawInput,
    inputType: input.inputType ?? "text",
    tags: input.tags ?? [],
    status: "captured",
    personaStyle: input.personaStyle ?? "motivational",
    sketchUrl: input.sketchData,
    createdAt: now,
    updatedAt: now,
  };

  dreams.push(dream);
  await writeDreams(dreams);
  return dream;
}

export async function updateDream(
  id: string,
  updates: Partial<Dream>
): Promise<Dream | null> {
  const dreams = await readDreams();
  const index = dreams.findIndex((d) => d.id === id);
  if (index === -1) return null;

  dreams[index] = {
    ...dreams[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await writeDreams(dreams);
  return dreams[index];
}

export async function deleteDream(id: string): Promise<boolean> {
  const dreams = await readDreams();
  const filtered = dreams.filter((d) => d.id !== id);
  if (filtered.length === dreams.length) return false;
  await writeDreams(filtered);
  return true;
}

export async function setRoadmap(id: string, roadmap: Roadmap): Promise<Dream | null> {
  return updateDream(id, { roadmap, status: "expanded" });
}

export async function setRefinedContent(
  id: string,
  refinedContent: string,
  motivationalNudge: string
): Promise<Dream | null> {
  return updateDream(id, {
    refinedContent,
    motivationalNudge,
    status: "refined",
  });
}

export async function toggleMilestone(
  dreamId: string,
  milestoneId: string
): Promise<Dream | null> {
  const dream = await getDreamById(dreamId);
  if (!dream?.roadmap) return null;

  const milestones = dream.roadmap.milestones.map((m) => {
    if (m.id !== milestoneId) return m;
    const completed = !m.completed;
    return {
      ...m,
      completed,
      completedAt: completed ? new Date().toISOString() : undefined,
    };
  });

  const allDone = milestones.every((m) => m.completed);
  const anyDone = milestones.some((m) => m.completed);

  return updateDream(dreamId, {
    roadmap: { ...dream.roadmap, milestones },
    status: allDone ? "completed" : anyDone ? "active" : dream.status,
  });
}

export async function adaptDream(
  id: string,
  input: AdaptDreamInput,
  newRoadmap?: Roadmap,
  newNudge?: string
): Promise<Dream | null> {
  const dream = await getDreamById(id);
  if (!dream) return null;

  const updates: Partial<Dream> = { status: "active" };

  if (input.newGoal) {
    updates.rawInput = input.newGoal;
    updates.title = extractTitle(input.newGoal);
  }

  if (input.completedMilestoneId && dream.roadmap) {
    const milestones = dream.roadmap.milestones.map((m) =>
      m.id === input.completedMilestoneId
        ? { ...m, completed: true, completedAt: new Date().toISOString() }
        : m
    );
    updates.roadmap = { ...dream.roadmap, milestones };
  }

  if (newRoadmap) {
    updates.roadmap = newRoadmap;
  }

  if (newNudge) {
    updates.motivationalNudge = newNudge;
  }

  return updateDream(id, updates);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const dreams = await getAllDreams();
  let completedMilestones = 0;
  let totalMilestones = 0;

  for (const dream of dreams) {
    if (dream.roadmap) {
      totalMilestones += dream.roadmap.milestones.length;
      completedMilestones += dream.roadmap.milestones.filter((m) => m.completed).length;
    }
  }

  return {
    totalDreams: dreams.length,
    activeDreams: dreams.filter((d) => d.status === "active" || d.status === "refined").length,
    completedMilestones,
    totalMilestones,
    overallProgress:
      totalMilestones > 0
        ? Math.round((completedMilestones / totalMilestones) * 100)
        : 0,
  };
}

export function createMilestones(
  titles: string[],
  descriptions: string[]
): Milestone[] {
  return titles.map((title, i) => ({
    id: uuidv4(),
    title,
    description: descriptions[i] ?? "",
    completed: false,
    order: i,
  }));
}

export async function addMilestone(
  dreamId: string,
  title: string,
  description: string
): Promise<Dream | null> {
  const dream = await getDreamById(dreamId);
  if (!dream) return null;

  const milestones = dream.roadmap?.milestones ?? [];
  const newMilestone: Milestone = {
    id: uuidv4(),
    title: title.trim(),
    description: description.trim(),
    completed: false,
    order: milestones.length,
  };

  const updatedMilestones = [...milestones, newMilestone];
  const roadmap: Roadmap = dream.roadmap
    ? { ...dream.roadmap, milestones: updatedMilestones }
    : { summary: "Roadmap", milestones: updatedMilestones, generatedAt: new Date().toISOString() };

  return updateDream(dreamId, { roadmap, status: "active" });
}

export async function updateMilestone(
  dreamId: string,
  milestoneId: string,
  title: string,
  description: string
): Promise<Dream | null> {
  const dream = await getDreamById(dreamId);
  if (!dream?.roadmap) return null;

  const milestones = dream.roadmap.milestones.map((m) =>
    m.id === milestoneId
      ? { ...m, title: title.trim(), description: description.trim() }
      : m
  );

  return updateDream(dreamId, {
    roadmap: { ...dream.roadmap, milestones },
  });
}

export async function deleteMilestone(
  dreamId: string,
  milestoneId: string
): Promise<Dream | null> {
  const dream = await getDreamById(dreamId);
  if (!dream?.roadmap) return null;

  const filtered = dream.roadmap.milestones.filter((m) => m.id !== milestoneId);
  const milestones = filtered.map((m, index) => ({
    ...m,
    order: index,
  }));

  const allDone = milestones.length > 0 && milestones.every((m) => m.completed);
  const anyDone = milestones.some((m) => m.completed);
  const status = milestones.length === 0 ? "expanded" : allDone ? "completed" : anyDone ? "active" : dream.status;

  return updateDream(dreamId, {
    roadmap: { ...dream.roadmap, milestones },
    status,
  });
}

export async function reorderMilestones(
  dreamId: string,
  orderedIds: string[]
): Promise<Dream | null> {
  const dream = await getDreamById(dreamId);
  if (!dream?.roadmap) return null;

  const milestoneMap = new Map(dream.roadmap.milestones.map((m) => [m.id, m]));
  const milestones: Milestone[] = [];

  orderedIds.forEach((id, index) => {
    const milestone = milestoneMap.get(id);
    if (milestone) {
      milestones.push({
        ...milestone,
        order: index,
      });
    }
  });

  // Append any milestones that were not in orderedIds, just in case
  dream.roadmap.milestones.forEach((m) => {
    if (!orderedIds.includes(m.id)) {
      milestones.push({
        ...m,
        order: milestones.length,
      });
    }
  });

  return updateDream(dreamId, {
    roadmap: { ...dream.roadmap, milestones },
  });
}

export type { PersonaStyle };

