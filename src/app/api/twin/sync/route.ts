import { NextResponse } from "next/server";
import { getTwin } from "@/lib/twin-db";
import { syncTwinFromDreams } from "@/lib/twin-sync";

export async function POST() {
  try {
    const twin = await getTwin();
    if (!twin) {
      return NextResponse.json({ error: "Twin not found" }, { status: 404 });
    }

    const updated = await syncTwinFromDreams();
    return NextResponse.json({ twin: updated });
  } catch {
    return NextResponse.json({ error: "Failed to sync twin" }, { status: 500 });
  }
}
