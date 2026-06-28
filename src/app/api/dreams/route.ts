import { NextResponse } from "next/server";
import { createDream, getAllDreams, getDashboardStats } from "@/lib/db";
import { syncTwinFromDreams } from "@/lib/twin-sync";
import type { CreateDreamInput } from "@/lib/types";

export async function GET() {
  const [dreams, stats] = await Promise.all([getAllDreams(), getDashboardStats()]);
  return NextResponse.json({ dreams, stats });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateDreamInput;

    if (!body.rawInput?.trim()) {
      return NextResponse.json({ error: "Dream input is required" }, { status: 400 });
    }

    const dream = await createDream(body);
    await syncTwinFromDreams("new_dream", `Captured new dream: "${dream.title}"`);
    return NextResponse.json(dream, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to capture dream" }, { status: 500 });
  }
}
