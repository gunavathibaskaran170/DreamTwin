import { NextResponse } from "next/server";
import { getAllDreams } from "@/lib/db";
import { addTwinMessage, getTwin } from "@/lib/twin-db";
import { buildFullTwinContext } from "@/lib/twin-sync";
import { chatWithTwin } from "@/lib/llm";

export async function POST(request: Request) {
  try {
    const twin = await getTwin();
    if (!twin) {
      return NextResponse.json({ error: "Create your digital twin first" }, { status: 404 });
    }

    const { message } = await request.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const dreams = await getAllDreams();
    const context = buildFullTwinContext(twin, dreams);
    const history = twin.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    await addTwinMessage("user", message.trim());
    const reply = await chatWithTwin(message.trim(), context, history);
    const updated = await addTwinMessage("twin", reply);

    return NextResponse.json({
      reply,
      twin: updated,
    });
  } catch {
    return NextResponse.json({ error: "Failed to chat with twin" }, { status: 500 });
  }
}
