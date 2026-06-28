import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import type {
  CreateTwinInput,
  DigitalTwin,
  TwinEvolutionEntry,
  TwinMessage,
  UpdateTwinInput,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const TWIN_FILE = path.join(DATA_DIR, "twin.json");

async function ensureTwinFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(TWIN_FILE);
  } catch {
    await fs.writeFile(TWIN_FILE, JSON.stringify(null));
  }
}

export async function getTwin(): Promise<DigitalTwin | null> {
  await ensureTwinFile();
  const raw = await fs.readFile(TWIN_FILE, "utf-8");
  const parsed = JSON.parse(raw);
  return parsed as DigitalTwin | null;
}

async function saveTwin(twin: DigitalTwin): Promise<void> {
  await ensureTwinFile();
  await fs.writeFile(TWIN_FILE, JSON.stringify(twin, null, 2));
}

export async function createTwin(input: CreateTwinInput): Promise<DigitalTwin> {
  const now = new Date().toISOString();
  const twin: DigitalTwin = {
    id: uuidv4(),
    name: input.name.trim(),
    twinName: input.twinName?.trim() || `${input.name.trim()}'s DreamTwin`,
    avatar: input.avatar ?? "spark",
    tagline: input.tagline ?? "Your future self, guiding every step",
    coreValues: input.coreValues ?? ["Growth", "Purpose", "Persistence"],
    aspirationSummary: "Just getting started — your twin is learning who you want to become.",
    preferredStyle: input.preferredStyle ?? "motivational",
    traits: [
      { name: "Mindset", value: "Dreamer" },
      { name: "Energy", value: "Building" },
    ],
    evolutionLog: [
      {
        timestamp: now,
        event: "created",
        summary: `${input.name}'s digital twin was born — ready to guard their dreams.`,
      },
    ],
    syncLevel: 10,
    messages: [],
    lastSyncedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  await saveTwin(twin);
  return twin;
}

export async function updateTwin(input: UpdateTwinInput): Promise<DigitalTwin | null> {
  const twin = await getTwin();
  if (!twin) return null;

  const updated: DigitalTwin = {
    ...twin,
    ...input,
    updatedAt: new Date().toISOString(),
  };

  await saveTwin(updated);
  return updated;
}

export async function addTwinMessage(
  role: "user" | "twin",
  content: string
): Promise<DigitalTwin | null> {
  const twin = await getTwin();
  if (!twin) return null;

  const message: TwinMessage = {
    id: uuidv4(),
    role,
    content,
    timestamp: new Date().toISOString(),
  };

  twin.messages = [...twin.messages, message].slice(-50);
  twin.updatedAt = new Date().toISOString();
  await saveTwin(twin);
  return twin;
}

export async function applyTwinSync(updates: {
  aspirationSummary?: string;
  traits?: DigitalTwin["traits"];
  syncLevel?: number;
  evolutionEntry?: TwinEvolutionEntry;
  preferredStyle?: DigitalTwin["preferredStyle"];
}): Promise<DigitalTwin | null> {
  const twin = await getTwin();
  if (!twin) return null;

  if (updates.aspirationSummary) twin.aspirationSummary = updates.aspirationSummary;
  if (updates.traits) twin.traits = updates.traits;
  if (updates.preferredStyle) twin.preferredStyle = updates.preferredStyle;
  if (updates.syncLevel !== undefined) {
    twin.syncLevel = Math.min(100, Math.max(twin.syncLevel, updates.syncLevel));
  }
  if (updates.evolutionEntry) {
    twin.evolutionLog = [...twin.evolutionLog, updates.evolutionEntry].slice(-30);
  }

  twin.lastSyncedAt = new Date().toISOString();
  twin.updatedAt = new Date().toISOString();
  await saveTwin(twin);
  return twin;
}

export function twinToContext(twin: DigitalTwin): import("./types").TwinContext {
  return {
    name: twin.name,
    twinName: twin.twinName,
    aspirationSummary: twin.aspirationSummary,
    coreValues: twin.coreValues,
    traits: twin.traits,
    preferredStyle: twin.preferredStyle,
    syncLevel: twin.syncLevel,
    activeDreams: [],
    recentProgress: "",
  };
}
