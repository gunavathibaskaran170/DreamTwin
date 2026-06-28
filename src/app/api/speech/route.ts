import { NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/llm";

export async function POST(request: Request) {
  try {
    const { audio } = await request.json();

    if (!audio) {
      return NextResponse.json({ error: "Audio data is required" }, { status: 400 });
    }

    const text = await transcribeAudio(audio);
    return NextResponse.json({ text });
  } catch {
    return NextResponse.json({ error: "Failed to transcribe audio" }, { status: 500 });
  }
}
