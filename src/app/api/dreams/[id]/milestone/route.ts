import { NextResponse } from "next/server";
import { getDreamById, toggleMilestone } from "@/lib/db";
import { syncTwinFromDreams } from "@/lib/twin-sync";

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
    const { milestoneId } = await request.json();

    if (!milestoneId) {
      return NextResponse.json({ error: "milestoneId is required" }, { status: 400 });
    }

    const updated = await toggleMilestone(id, milestoneId);
    const milestone = updated?.roadmap?.milestones.find((m) => m.id === milestoneId);

    if (milestone?.completed) {
      await syncTwinFromDreams(
        "milestone_completed",
        `Completed "${milestone.title}" on "${dream.title}"`
      );
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to toggle milestone" }, { status: 500 });
  }
}
