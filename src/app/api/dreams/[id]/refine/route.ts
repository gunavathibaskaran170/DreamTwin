import { NextResponse } from "next/server";
import { getDreamById, setRefinedContent } from "@/lib/db";
import { refineRoadmap } from "@/lib/llm";
import { getTwinContextForLLM } from "@/lib/twin-context";
import { syncTwinFromDreams } from "@/lib/twin-sync";
import type { PersonaStyle } from "@/lib/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const dream = await getDreamById(id);

  if (!dream) {
    return NextResponse.json({ error: "Dream not found" }, { status: 404 });
  }

  if (!dream.roadmap) {
    return NextResponse.json({ error: "Dream must be expanded first" }, { status: 400 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const style = (body.style as PersonaStyle) ?? dream.personaStyle;
    const twinContext = await getTwinContextForLLM();

    const { refinedContent, nudge } = await refineRoadmap(
      dream.rawInput,
      dream.roadmap,
      style,
      twinContext
    );

    const updated = await setRefinedContent(id, refinedContent, nudge);
    await syncTwinFromDreams("style_changed", `Refined "${dream.title}" in ${style} style`);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to refine dream" }, { status: 500 });
  }
}
