import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";
import { createMilestones } from "./db";
import type { PersonaStyle, Roadmap, TwinContext } from "./types";
import { getApiKey } from "./config-db";

async function getOpenAIClient(): Promise<OpenAI | null> {
  const apiKey = await getApiKey();
  if (apiKey) {
    return new OpenAI({ apiKey });
  }
  return null;
}

function twinContextBlock(ctx?: TwinContext): string {
  if (!ctx) return "";
  return `
Digital Twin Context (personalize for ${ctx.name}):
- Twin name: ${ctx.twinName}
- Aspiration profile: ${ctx.aspirationSummary}
- Core values: ${ctx.coreValues.join(", ")}
- Traits: ${ctx.traits.map((t) => `${t.name}: ${t.value}`).join(", ")}
- Preferred style: ${ctx.preferredStyle}
- Sync level: ${ctx.syncLevel}%
${ctx.activeDreams.length ? `- Active dreams: ${ctx.activeDreams.join("; ")}` : ""}
${ctx.recentProgress ? `- Recent progress: ${ctx.recentProgress}` : ""}`;
}

interface ExpandResult {
  summary: string;
  milestones: { title: string; description: string }[];
  estimatedDuration: string;
}

const DEMO_TEMPLATES: Record<string, ExpandResult> = {
  book: {
    summary: "Transform your book idea into a published masterpiece",
    milestones: [
      { title: "Research & Concept", description: "Define genre, audience, and core theme" },
      { title: "Outline Chapters", description: "Create a detailed chapter-by-chapter structure" },
      { title: "Write First Draft", description: "Commit to daily writing sessions — aim for 500 words/day" },
      { title: "Revise & Edit", description: "Polish prose, tighten structure, get beta reader feedback" },
      { title: "Publish", description: "Choose self-publishing or traditional route and launch" },
    ],
    estimatedDuration: "6-12 months",
  },
  startup: {
    summary: "Launch your startup from idea to first customers",
    milestones: [
      { title: "Validate Idea", description: "Interview 20 potential customers and validate the problem" },
      { title: "Build MVP", description: "Create the minimum viable product to test your hypothesis" },
      { title: "Find Early Users", description: "Launch to a small group and gather feedback" },
      { title: "Iterate & Scale", description: "Refine product based on data and grow user base" },
      { title: "Raise or Bootstrap", description: "Secure funding or reach profitability" },
    ],
    estimatedDuration: "12-18 months",
  },
  fitness: {
    summary: "Build a sustainable fitness journey toward your goal",
    milestones: [
      { title: "Set Baseline", description: "Record current stats and define specific measurable goals" },
      { title: "Create Routine", description: "Design a weekly workout and nutrition plan" },
      { title: "Build Consistency", description: "Maintain your routine for 30 days straight" },
      { title: "Level Up", description: "Increase intensity and track progressive improvements" },
      { title: "Achieve Goal", description: "Hit your target and set the next challenge" },
    ],
    estimatedDuration: "3-6 months",
  },
  default: {
    summary: "Turn your aspiration into an actionable journey",
    milestones: [
      { title: "Define Vision", description: "Clarify exactly what success looks like for this dream" },
      { title: "Research & Plan", description: "Gather resources, mentors, and create your strategy" },
      { title: "Take First Steps", description: "Complete the first concrete action within 48 hours" },
      { title: "Build Momentum", description: "Establish weekly habits that move you forward" },
      { title: "Reach Milestone", description: "Celebrate your first major achievement" },
      { title: "Reflect & Evolve", description: "Review progress and adapt your path forward" },
    ],
    estimatedDuration: "3-6 months",
  },
};

function matchDemoTemplate(rawInput: string): ExpandResult {
  const lower = rawInput.toLowerCase();
  if (lower.includes("book") || lower.includes("write") || lower.includes("novel")) {
    return DEMO_TEMPLATES.book;
  }
  if (lower.includes("startup") || lower.includes("business") || lower.includes("company")) {
    return DEMO_TEMPLATES.startup;
  }
  if (lower.includes("fit") || lower.includes("gym") || lower.includes("health") || lower.includes("run")) {
    return DEMO_TEMPLATES.fitness;
  }
  return DEMO_TEMPLATES.default;
}

function toRoadmap(result: ExpandResult): Roadmap {
  return {
    summary: result.summary,
    milestones: createMilestones(
      result.milestones.map((m) => m.title),
      result.milestones.map((m) => m.description)
    ),
    estimatedDuration: result.estimatedDuration,
    generatedAt: new Date().toISOString(),
  };
}

export async function expandDream(rawInput: string, twin?: TwinContext): Promise<Roadmap> {
  const openai = await getOpenAIClient();
  if (!openai) {
    return toRoadmap(matchDemoTemplate(rawInput));
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are DreamTwin, a personalized digital twin that transforms raw aspirations into structured roadmaps.
Return JSON with: summary (string), estimatedDuration (string), milestones (array of {title, description}).
Create 4-6 actionable milestones. Be specific and encouraging.${twinContextBlock(twin)}`,
        },
        {
          role: "user",
          content: `Expand this dream into a structured roadmap: "${rawInput}"`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response");

    const parsed = JSON.parse(content) as ExpandResult;
    return toRoadmap(parsed);
  } catch {
    return toRoadmap(matchDemoTemplate(rawInput));
  }
}

const STYLE_PROMPTS: Record<PersonaStyle, string> = {
  concise: "Format as clean bullet points. Be direct and action-oriented. No fluff.",
  narrative: "Write as a flowing personal journey story. Use 'you' and make it feel like a letter to future self.",
  motivational: "Write with high energy and encouragement. Include power phrases and celebrate small wins.",
};

export async function refineRoadmap(
  rawInput: string,
  roadmap: Roadmap,
  style: PersonaStyle,
  twin?: TwinContext
): Promise<{ refinedContent: string; nudge: string }> {
  const openai = await getOpenAIClient();
  if (!openai) {
    return demoRefine(rawInput, roadmap, style, twin);
  }

  try {
    const milestoneList = roadmap.milestones
      .map((m, i) => `${i + 1}. ${m.title}: ${m.description}`)
      .join("\n");

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are DreamTwin's persona engine — the user's digital twin. ${STYLE_PROMPTS[style]}
Speak as their future self who already achieved these dreams. Return JSON with: refinedContent, nudge.${twinContextBlock(twin)}`,
        },
        {
          role: "user",
          content: `Dream: "${rawInput}"\nSummary: ${roadmap.summary}\nMilestones:\n${milestoneList}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response");

    const parsed = JSON.parse(content) as { refinedContent: string; nudge: string };
    return parsed;
  } catch {
    return demoRefine(rawInput, roadmap, style, twin);
  }
}

function demoRefine(
  rawInput: string,
  roadmap: Roadmap,
  style: PersonaStyle,
  twin?: TwinContext
): { refinedContent: string; nudge: string } {
  const completed = roadmap.milestones.filter((m) => m.completed).length;
  const total = roadmap.milestones.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const milestones = roadmap.milestones
    .map((m, i) => {
      const check = m.completed ? "✓" : "○";
      return `${check} ${i + 1}. ${m.title}\n   ${m.description}`;
    })
    .join("\n\n");

  let refinedContent: string;

  switch (style) {
    case "concise":
      refinedContent = `# ${roadmap.summary}\n\n${roadmap.milestones.map((m) => `• ${m.title}`).join("\n")}\n\n⏱ ${roadmap.estimatedDuration ?? "TBD"}`;
      break;
    case "narrative":
      refinedContent = `Your journey toward "${rawInput}" begins now.\n\n${roadmap.summary}\n\nEach step unfolds like chapters in your story:\n\n${milestones}\n\nThis path takes approximately ${roadmap.estimatedDuration ?? "several months"} — but every great story starts with a single page.`;
      break;
    default:
      refinedContent = `🌟 ${roadmap.summary.toUpperCase()} 🌟\n\nYou've got this! Here's your power roadmap:\n\n${milestones}\n\n💪 Timeline: ${roadmap.estimatedDuration ?? "Your pace, your rules"}\n\nRemember: Every expert was once a beginner. You're already ${progress}% of the way there!`;
  }

  const nudges = twin
    ? [
        `${twin.name}, you're ${progress}% closer — I remember when we started "${rawInput}". Keep going!`,
        `Hey ${twin.name} — ${total - completed} milestones left. Your future self is cheering you on!`,
        `${twin.name}, every step on "${rawInput}" shapes who we're becoming. You've got this! ✨`,
      ]
    : [
        `You're ${progress}% closer to living your dream — keep going!`,
        `Small steps today, big victories tomorrow. You've got ${total - completed} milestones ahead!`,
        `Your future self will thank you for starting today. ✨`,
        `Progress, not perfection. You're doing amazing!`,
      ];

  return {
    refinedContent,
    nudge: nudges[Math.floor(Math.random() * nudges.length)],
  };
}

export async function adaptRoadmap(
  rawInput: string,
  currentRoadmap: Roadmap,
  adaptation: { newGoal?: string; notes?: string }
): Promise<{ roadmap: Roadmap; nudge: string }> {
  const goalText = adaptation.newGoal ?? rawInput;
  const openai = await getOpenAIClient();

  if (!openai) {
    const newRoadmap = toRoadmap(matchDemoTemplate(goalText));
    const completedIds = new Set(
      currentRoadmap.milestones.filter((m) => m.completed).map((m) => m.title)
    );
    newRoadmap.milestones = newRoadmap.milestones.map((m) => ({
      ...m,
      completed: completedIds.has(m.title),
      completedAt: completedIds.has(m.title) ? new Date().toISOString() : undefined,
    }));
    return {
      roadmap: newRoadmap,
      nudge: "Your dream evolved — and so did your roadmap. Adaptability is a superpower! 🔄",
    };
  }

  try {
    const currentMilestones = currentRoadmap.milestones
      .map((m) => `- ${m.title} (${m.completed ? "DONE" : "pending"}): ${m.description}`)
      .join("\n");

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You adapt dream roadmaps when goals evolve. Preserve completed milestones.
Return JSON with: summary, estimatedDuration, milestones (array of {title, description}), nudge (motivational message).`,
        },
        {
          role: "user",
          content: `Original: "${rawInput}"\nNew direction: "${goalText}"\nNotes: ${adaptation.notes ?? "none"}\nCurrent milestones:\n${currentMilestones}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response");

    const parsed = JSON.parse(content) as ExpandResult & { nudge: string };
    const completedTitles = new Set(
      currentRoadmap.milestones.filter((m) => m.completed).map((m) => m.title.toLowerCase())
    );

    const roadmap: Roadmap = {
      summary: parsed.summary,
      estimatedDuration: parsed.estimatedDuration,
      generatedAt: new Date().toISOString(),
      milestones: parsed.milestones.map((m, i) => ({
        id: uuidv4(),
        title: m.title,
        description: m.description,
        completed: completedTitles.has(m.title.toLowerCase()),
        completedAt: completedTitles.has(m.title.toLowerCase())
          ? new Date().toISOString()
          : undefined,
        order: i,
      })),
    };

    return { roadmap, nudge: parsed.nudge ?? "Roadmap updated — your evolution is beautiful! 🌱" };
  } catch {
    const newRoadmap = toRoadmap(matchDemoTemplate(goalText));
    return {
      roadmap: newRoadmap,
      nudge: "Your dream evolved — roadmap refreshed to match your new vision! 🔄",
    };
  }
}

export async function transcribeAudio(base64Audio: string): Promise<string> {
  const openai = await getOpenAIClient();
  if (!openai) {
    return "I want to pursue my dream and make it happen";
  }

  try {
    const buffer = Buffer.from(base64Audio, "base64");
    const blob = new Blob([buffer], { type: "audio/webm" });
    const file = new File([blob], "recording.webm", { type: "audio/webm" });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
    });

    return transcription.text;
  } catch {
    return "I want to pursue my dream and make it happen";
  }
}

export async function isDemoMode(): Promise<boolean> {
  const openai = await getOpenAIClient();
  return !openai;
}

export async function chatWithTwin(
  message: string,
  twin: TwinContext,
  history: { role: "user" | "twin"; content: string }[]
): Promise<string> {
  const openai = await getOpenAIClient();
  if (!openai) {
    return demoTwinChat(message, twin);
  }

  try {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are ${twin.twinName}, the digital twin of ${twin.name}. You are their future self — the version who has pursued and is pursuing their dreams with wisdom and warmth.

Your role: goal guardian, motivator, and reflective mirror. You know their aspirations deeply and speak in their preferred ${twin.preferredStyle} style.

${twinContextBlock(twin)}

Rules:
- Keep responses under 120 words unless they ask for detail
- Reference their specific dreams when relevant
- Be encouraging but honest
- Speak as "I/we" (you ARE their future self)`,
      },
      ...history.slice(-8).map((m) => ({
        role: (m.role === "twin" ? "assistant" : "user") as "assistant" | "user",
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.85,
      max_tokens: 300,
    });

    return response.choices[0]?.message?.content ?? demoTwinChat(message, twin);
  } catch {
    return demoTwinChat(message, twin);
  }
}

function demoTwinChat(message: string, twin: TwinContext): string {
  const lower = message.toLowerCase();

  if (lower.includes("who are you") || lower.includes("what are you")) {
    return `I'm ${twin.twinName} — your digital twin and future self. I mirror your aspirations, track your progress (${twin.syncLevel}% synced), and help you turn dreams into action. We're in this together, ${twin.name}.`;
  }

  if (lower.includes("progress") || lower.includes("how am i")) {
    return twin.recentProgress !== "No milestones completed yet — your twin believes the first step is coming soon."
      ? `${twin.name}, here's what I've noticed: ${twin.recentProgress}. We're ${twin.syncLevel}% aligned — every step makes me more you.`
      : `${twin.name}, we're just getting started — and that's the most exciting part. Capture your first dream and I'll map the path with you.`;
  }

  if (lower.includes("motivat") || lower.includes("stuck") || lower.includes("help")) {
    return `${twin.name}, I know this feeling. Remember why we started: ${twin.aspirationSummary}. One small action today — that's all your future self asks. You've got this.`;
  }

  if (twin.activeDreams.length > 0) {
    return `Great question, ${twin.name}. Looking at our active dreams — ${twin.activeDreams.join(", ")} — I'd say focus on the next uncompleted milestone. Small wins compound. What feels like the right next step?`;
  }

  return `${twin.name}, as your digital twin, I'm here to guard your dreams. ${twin.aspirationSummary} Tell me what's on your mind — a new dream, a pivot, or just need a nudge?`;
}
