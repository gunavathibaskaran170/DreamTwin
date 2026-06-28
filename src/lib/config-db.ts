import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const CONFIG_FILE = path.join(DATA_DIR, "config.json");

export interface AppConfig {
  openaiApiKey?: string;
}

async function ensureConfigFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(CONFIG_FILE);
  } catch {
    await fs.writeFile(CONFIG_FILE, JSON.stringify({}, null, 2));
  }
}

export async function getConfig(): Promise<AppConfig> {
  await ensureConfigFile();
  try {
    const raw = await fs.readFile(CONFIG_FILE, "utf-8");
    return JSON.parse(raw) as AppConfig;
  } catch {
    return {};
  }
}

export async function saveConfig(config: AppConfig): Promise<void> {
  await ensureConfigFile();
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export async function getApiKey(): Promise<string | undefined> {
  const config = await getConfig();
  if (config.openaiApiKey?.trim()) {
    return config.openaiApiKey.trim();
  }
  return process.env.OPENAI_API_KEY;
}
