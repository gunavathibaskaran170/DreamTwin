import { NextResponse } from "next/server";
import { getDreamById, setRoadmap } from "@/lib/db";
import { expandDream } from "@/lib/llm";
import { getTwinContextForLLM } from "@/lib/twin-context";
import { syncTwinFromDreams } from "@/lib/twin-sync";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const dream = await getDreamById(id);

  if (!dream) {
    return NextResponse.json({ error: "Dream not found" }, { status: 404 });
  }

  try {
    const twinContext = await getTwinContextForLLM();
    const roadmap = await expandDream(dream.rawInput, twinContext);
    const updated = await setRoadmap(id, roadmap);
    await syncTwinFromDreams("new_dream", `Expanded roadmap for "${dream.title}"`);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to expand dream" }, { status: 500 });
  }
}
