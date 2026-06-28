import { NextResponse } from "next/server";
import { getConfig, saveConfig, getApiKey } from "@/lib/config-db";

export async function GET() {
  const apiKey = await getApiKey();
  return NextResponse.json({
    hasApiKey: !!apiKey,
    isDemoMode: !apiKey,
  });
}

export async function POST(request: Request) {
  try {
    const { apiKey } = await request.json();
    const config = await getConfig();
    config.openaiApiKey = apiKey ? apiKey.trim() : undefined;
    await saveConfig(config);
    return NextResponse.json({ success: true, hasApiKey: !!config.openaiApiKey });
  } catch {
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const config = await getConfig();
    config.openaiApiKey = undefined;
    await saveConfig(config);
    return NextResponse.json({ success: true, hasApiKey: false });
  } catch {
    return NextResponse.json({ error: "Failed to clear settings" }, { status: 500 });
  }
}
