import * as fs from "fs";
import * as path from "path";
import { EnvSchema } from "./types";
import { serializeSchema } from "./schemaExporter";

export interface SchemaSnapshot {
  timestamp: string;
  schemaPath: string;
  content: EnvSchema;
}

export function takeSnapshot(schema: EnvSchema, schemaPath: string): SchemaSnapshot {
  return {
    timestamp: new Date().toISOString(),
    schemaPath: path.resolve(schemaPath),
    content: schema,
  };
}

export function saveSnapshot(snapshot: SchemaSnapshot, outputPath: string): void {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, JSON.stringify(snapshot, null, 2), "utf-8");
}

export function loadSnapshot(snapshotPath: string): SchemaSnapshot {
  if (!fs.existsSync(snapshotPath)) {
    throw new Error(`Snapshot file not found: ${snapshotPath}`);
  }
  const raw = fs.readFileSync(snapshotPath, "utf-8");
  const parsed = JSON.parse(raw);
  if (!parsed.timestamp || !parsed.schemaPath || !parsed.content) {
    throw new Error(`Invalid snapshot format in: ${snapshotPath}`);
  }
  return parsed as SchemaSnapshot;
}

export function listSnapshots(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".snapshot.json"))
    .map((f) => path.join(dir, f))
    .sort();
}

export function resolveSnapshotPath(dir: string, schemaPath: string): string {
  const base = path.basename(schemaPath, path.extname(schemaPath));
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  return path.join(dir, `${base}-${ts}.snapshot.json`);
}
