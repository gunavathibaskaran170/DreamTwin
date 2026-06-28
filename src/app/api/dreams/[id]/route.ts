import { NextResponse } from "next/server";
import { deleteDream, getDreamById } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const dream = await getDreamById(id);

  if (!dream) {
    return NextResponse.json({ error: "Dream not found" }, { status: 404 });
  }

  return NextResponse.json(dream);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = await deleteDream(id);

  if (!deleted) {
    return NextResponse.json({ error: "Dream not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
