import { getAllDreams, getDashboardStats } from "@/lib/db";
import { getTwin } from "@/lib/twin-db";
import Dashboard from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [dreams, stats, twin] = await Promise.all([
    getAllDreams(),
    getDashboardStats(),
    getTwin(),
  ]);

  return (
    <Dashboard
      initialDreams={dreams}
      initialStats={stats}
      initialTwin={twin}
    />
  );
}
