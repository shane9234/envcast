import * as path from "path";
import { loadSchema } from "../schema/schemaLoader";
import { loadSnapshot, listSnapshots, resolveSnapshotPath, saveSnapshot, takeSnapshot } from "../schema/schemaSnapshotter";
import { diffSchemas, isSchemaDiffEmpty } from "../schema/schemaDiff";
import { CliOptions } from "./cliOptions";

const DEFAULT_SNAPSHOT_DIR = ".envcast/snapshots";

export async function handleSnapshot(options: CliOptions): Promise<void> {
  const schemaPath = options.schema ?? "envcast.schema.json";
  const snapshotDir = options.output ?? DEFAULT_SNAPSHOT_DIR;

  if (options.compare) {
    await handleSnapshotCompare(schemaPath, options.compare);
    return;
  }

  if (options.list) {
    handleSnapshotList(snapshotDir);
    return;
  }

  await handleSnapshotCreate(schemaPath, snapshotDir);
}

async function handleSnapshotCreate(schemaPath: string, snapshotDir: string): Promise<void> {
  const schema = await loadSchema(schemaPath);
  const snapshot = takeSnapshot(schema, schemaPath);
  const outPath = resolveSnapshotPath(snapshotDir, schemaPath);
  saveSnapshot(snapshot, outPath);
  console.log(`Snapshot saved: ${outPath}`);
}

async function handleSnapshotCompare(schemaPath: string, snapshotPath: string): Promise<void> {
  const schema = await loadSchema(schemaPath);
  const snapshot = loadSnapshot(snapshotPath);
  const diff = diffSchemas(snapshot.content, schema);

  if (isSchemaDiffEmpty(diff)) {
    console.log("No changes detected since snapshot.");
    return;
  }

  console.log(`Comparing current schema against snapshot from ${snapshot.timestamp}:\n`);

  if (diff.added.length > 0) {
    console.log(`  Added fields (${diff.added.length}): ${diff.added.join(", ")}`);
  }
  if (diff.removed.length > 0) {
    console.log(`  Removed fields (${diff.removed.length}): ${diff.removed.join(", ")}`);
  }
  if (diff.changed.length > 0) {
    console.log(`  Changed fields (${diff.changed.length}): ${diff.changed.join(", ")}`);
  }
}

function handleSnapshotList(snapshotDir: string): void {
  const snapshots = listSnapshots(snapshotDir);
  if (snapshots.length === 0) {
    console.log(`No snapshots found in ${snapshotDir}`);
    return;
  }
  console.log(`Snapshots in ${snapshotDir}:`);
  snapshots.forEach((s) => console.log(`  - ${path.basename(s)}`));
}
