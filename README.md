# DreamTwin

**Your personal digital twin agent** — capture aspirations in any form, expand them into structured roadmaps, refine to your style, and track progress with motivational nudges.

## Features

| Module | Description |
|--------|-------------|
| **Capture** | Text, voice (speech-to-text), and sketch uploads |
| **Expand** | AI generates structured roadmaps with milestones |
| **Refine** | Persona styles: concise, narrative, motivational |
| **Adapt** | Dynamically update roadmaps as goals evolve |
| **Digital Twin** | Persistent AI mirror that learns, syncs, and chats as your future self |
| **Present** | Dashboard with progress tracking and nudges |

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Optional: Enable AI Mode

Copy `.env.example` to `.env.local` and add your OpenAI API key:

```
OPENAI_API_KEY=sk-your-key-here
```

Without an API key, DreamTwin runs in **demo mode** with intelligent template-based roadmaps.

## Digital Twin

DreamTwin isn't just a planner — it creates a **personalized digital twin** that:

- **Mirrors your aspirations** — learns from every dream you capture
- **Syncs dynamically** — sync level (0–100%) reflects how aligned the twin is with your goals
- **Speaks as your future self** — chat for motivation, advice, and reflection
- **Evolves with you** — traits, values, and evolution log update as you progress
- **Personalizes AI** — roadmaps and nudges use twin context for tailored output

### Twin Setup

On first visit, create your twin with:
- Your name and optional twin name
- Avatar (Spark, Compass, Star, Flame)
- Core values and communication style

Visit `/twin` for the full profile, evolution log, and extended chat.

## Demo Flow

1. Enter: *"I want to write a book"*
2. DreamTwin expands → Research → Outline → Draft → Edit → Publish
3. Refines into your chosen style with motivational nudges
4. Track milestones on the dashboard
5. Adapt when your vision evolves

## Architecture

```
Input Layer     → Text, Voice, Sketches
Processing Layer → LLM expansion & refinement
Memory Layer    → Dreams + Digital Twin profile (JSON store)
Persona Layer   → Style filters + twin personality
Twin Layer      → Sync engine, chat, evolution log
UI Layer        → Next.js dashboard + twin panel
```

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **OpenAI API** (optional)
- **File-based storage**

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dreams` | List all dreams + stats |
| POST | `/api/dreams` | Capture a new dream |
| POST | `/api/dreams/[id]/expand` | Expand into roadmap |
| POST | `/api/dreams/[id]/refine` | Apply persona style |
| POST | `/api/dreams/[id]/adapt` | Adapt evolving goals |
| POST | `/api/dreams/[id]/milestone` | Toggle milestone |
| POST | `/api/speech` | Transcribe voice input |
| POST | `/api/upload` | Upload sketch images |
| POST | `/api/twin` | Create digital twin |
| GET/PATCH | `/api/twin` | Get or update twin |
| POST | `/api/twin/chat` | Chat with your twin |
| POST | `/api/twin/sync` | Sync twin from dreams |

## License

MIT
