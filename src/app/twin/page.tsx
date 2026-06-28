import { redirect } from "next/navigation";
import { getTwin } from "@/lib/twin-db";
import TwinProfile from "@/components/TwinProfile";

export const dynamic = "force-dynamic";

export default async function TwinPage() {
  const twin = await getTwin();
  if (!twin) redirect("/");

  return <TwinProfile initialTwin={twin} />;
}
