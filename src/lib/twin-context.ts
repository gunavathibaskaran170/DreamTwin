import { getAllDreams } from "./db";
import { getTwin } from "./twin-db";
import { buildFullTwinContext } from "./twin-sync";
import type { TwinContext } from "./types";

export async function getTwinContextForLLM(): Promise<TwinContext | undefined> {
  const twin = await getTwin();
  if (!twin) return undefined;
  const dreams = await getAllDreams();
  return buildFullTwinContext(twin, dreams);
}
