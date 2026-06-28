export type TwinAvatar = "spark" | "compass" | "star" | "flame";
export type InputType = "text" | "voice" | "sketch";
export type PersonaStyle = "concise" | "narrative" | "motivational";
export type DreamStatus = "captured" | "expanded" | "refined" | "active" | "completed";

export interface TwinTrait {
  name: string;
  value: string;
}

export interface TwinEvolutionEntry {
  timestamp: string;
  event: "created" | "new_dream" | "milestone_completed" | "goal_pivoted" | "style_changed" | "sync";
  summary: string;
}

export interface TwinMessage {
  id: string;
  role: "user" | "twin";
  content: string;
  timestamp: string;
}

export interface DigitalTwin {
  id: string;
  name: string;
  twinName: string;
  avatar: TwinAvatar;
  tagline: string;
  coreValues: string[];
  aspirationSummary: string;
  preferredStyle: PersonaStyle;
  traits: TwinTrait[];
  evolutionLog: TwinEvolutionEntry[];
  syncLevel: number;
  messages: TwinMessage[];
  lastSyncedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTwinInput {
  name: string;
  twinName?: string;
  avatar?: TwinAvatar;
  coreValues?: string[];
  preferredStyle?: PersonaStyle;
  tagline?: string;
}

export interface UpdateTwinInput {
  name?: string;
  twinName?: string;
  avatar?: TwinAvatar;
  coreValues?: string[];
  preferredStyle?: PersonaStyle;
  tagline?: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completedAt?: string;
  order: number;
}

export interface Dream {
  id: string;
  title: string;
  rawInput: string;
  inputType: InputType;
  tags: string[];
  status: DreamStatus;
  personaStyle: PersonaStyle;
  roadmap?: Roadmap;
  refinedContent?: string;
  motivationalNudge?: string;
  sketchUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Roadmap {
  summary: string;
  milestones: Milestone[];
  estimatedDuration?: string;
  generatedAt: string;
}

export interface CreateDreamInput {
  rawInput: string;
  inputType?: InputType;
  tags?: string[];
  personaStyle?: PersonaStyle;
  sketchData?: string;
}

export interface AdaptDreamInput {
  newGoal?: string;
  completedMilestoneId?: string;
  notes?: string;
}

export interface DashboardStats {
  totalDreams: number;
  activeDreams: number;
  completedMilestones: number;
  totalMilestones: number;
  overallProgress: number;
}

export interface TwinContext {
  name: string;
  twinName: string;
  aspirationSummary: string;
  coreValues: string[];
  traits: TwinTrait[];
  preferredStyle: PersonaStyle;
  syncLevel: number;
  activeDreams: string[];
  recentProgress: string;
}
