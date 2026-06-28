import { NextResponse } from "next/server";
import { getAllDreams } from "@/lib/db";
import { createTwin, getTwin, updateTwin } from "@/lib/twin-db";
import { buildFullTwinContext, syncTwinFromDreams } from "@/lib/twin-sync";
import type { CreateTwinInput, UpdateTwinInput } from "@/lib/types";

export async function GET() {
  const twin = await getTwin();
  if (!twin) {
    return NextResponse.json({ twin: null, initialized: false });
  }

  const dreams = await getAllDreams();
  const context = buildFullTwinContext(twin, dreams);

  return NextResponse.json({ twin, context, initialized: true });
}

export async function POST(request: Request) {
  try {
    const existing = await getTwin();
    if (existing) {
      return NextResponse.json({ error: "Twin already exists" }, { status: 409 });
    }

    const body = (await request.json()) as CreateTwinInput;
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const twin = await createTwin(body);
    await syncTwinFromDreams("created", `${twin.name}'s digital twin came to life.`);

    const updated = await getTwin();
    const dreams = await getAllDreams();
    const context = updated ? buildFullTwinContext(updated, dreams) : null;

    return NextResponse.json({ twin: updated, context }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create twin" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as UpdateTwinInput;
    const twin = await updateTwin(body);

    if (!twin) {
      return NextResponse.json({ error: "Twin not found" }, { status: 404 });
    }

    return NextResponse.json({ twin });
  } catch {
    return NextResponse.json({ error: "Failed to update twin" }, { status: 500 });
  }
}
