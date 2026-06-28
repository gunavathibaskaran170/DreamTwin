import { NextResponse } from "next/server";
import { adaptDream, getDreamById } from "@/lib/db";
import { adaptRoadmap } from "@/lib/llm";
import type { AdaptDreamInput } from "@/lib/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const dream = await getDreamById(id);

  if (!dream) {
    return NextResponse.json({ error: "Dream not found" }, { status: 404 });
  }

  try {
    const body = (await request.json()) as AdaptDreamInput;

    if (body.completedMilestoneId && dream.roadmap) {
      const updated = await adaptDream(id, body);
      return NextResponse.json(updated);
    }

    if (body.newGoal && dream.roadmap) {
      const { roadmap, nudge } = await adaptRoadmap(dream.rawInput, dream.roadmap, {
        newGoal: body.newGoal,
        notes: body.notes,
      });
      const updated = await adaptDream(id, body, roadmap, nudge);
      return NextResponse.json(updated);
    }

    const updated = await adaptDream(id, body);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to adapt dream" }, { status: 500 });
  }
}
