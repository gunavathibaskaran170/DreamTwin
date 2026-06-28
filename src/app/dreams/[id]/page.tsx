import { notFound } from "next/navigation";
import { getDreamById } from "@/lib/db";
import { getTwin } from "@/lib/twin-db";
import DreamDetail from "@/components/DreamDetail";

export const dynamic = "force-dynamic";

export default async function DreamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [dream, twin] = await Promise.all([getDreamById(id), getTwin()]);

  if (!dream) notFound();

  return <DreamDetail initialDream={dream} initialTwin={twin} />;
}
