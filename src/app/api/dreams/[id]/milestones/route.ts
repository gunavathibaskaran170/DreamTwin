import { NextResponse } from "next/server";
import { getDreamById, addMilestone, updateMilestone, deleteMilestone, reorderMilestones } from "@/lib/db";
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
    const body = await request.json();
    const { action } = body;

    let updated = null;
    let logSummary = "";

    if (action === "add") {
      const { title, description } = body;
      updated = await addMilestone(id, title || "New Milestone", description || "");
      logSummary = `Added milestone "${title}" to "${dream.title}"`;
    } else if (action === "edit") {
      const { milestoneId, title, description } = body;
      updated = await updateMilestone(id, milestoneId, title, description);
      logSummary = `Updated milestone details on "${dream.title}"`;
    } else if (action === "delete") {
      const { milestoneId } = body;
      const milestone = dream.roadmap?.milestones.find((m) => m.id === milestoneId);
      updated = await deleteMilestone(id, milestoneId);
      logSummary = `Deleted milestone "${milestone?.title || "unknown"}" from "${dream.title}"`;
    } else if (action === "reorder") {
      const { orderedIds } = body;
      updated = await reorderMilestones(id, orderedIds);
      logSummary = `Reordered milestones on "${dream.title}"`;
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (updated) {
      await syncTwinFromDreams("sync", logSummary);
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to manage milestones", error);
    return NextResponse.json({ error: "Failed to manage milestones" }, { status: 500 });
  }
}
