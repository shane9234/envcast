import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  takeSnapshot,
  saveSnapshot,
  loadSnapshot,
  listSnapshots,
  resolveSnapshotPath,
} from "./schemaSnapshotter";
import { EnvSchema } from "./types";

const sampleSchema: EnvSchema = {
  DATABASE_URL: { type: "string", required: true, description: "DB connection" },
  PORT: { type: "number", required: false, default: "3000" },
};

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envcast-snap-"));
}

describe("takeSnapshot", () => {
  it("creates a snapshot with timestamp and schema content", () => {
    const snap = takeSnapshot(sampleSchema, "./envcast.schema.json");
    expect(snap.content).toEqual(sampleSchema);
    expect(typeof snap.timestamp).toBe("string");
    expect(snap.schemaPath).toContain("envcast.schema.json");
  });
});

describe("saveSnapshot and loadSnapshot", () => {
  it("round-trips a snapshot to disk", () => {
    const dir = makeTempDir();
    const outPath = path.join(dir, "test.snapshot.json");
    const snap = takeSnapshot(sampleSchema, "./envcast.schema.json");
    saveSnapshot(snap, outPath);
    const loaded = loadSnapshot(outPath);
    expect(loaded.content).toEqual(sampleSchema);
    expect(loaded.timestamp).toBe(snap.timestamp);
  });

  it("throws if snapshot file does not exist", () => {
    expect(() => loadSnapshot("/nonexistent/snap.json")).toThrow("not found");
  });

  it("throws if snapshot format is invalid", () => {
    const dir = makeTempDir();
    const bad = path.join(dir, "bad.snapshot.json");
    fs.writeFileSync(bad, JSON.stringify({ foo: "bar" }));
    expect(() => loadSnapshot(bad)).toThrow("Invalid snapshot format");
  });
});

describe("listSnapshots", () => {
  it("returns sorted snapshot files from a directory", () => {
    const dir = makeTempDir();
    fs.writeFileSync(path.join(dir, "a.snapshot.json"), "{}");
    fs.writeFileSync(path.join(dir, "b.snapshot.json"), "{}");
    fs.writeFileSync(path.join(dir, "other.txt"), "ignored");
    const snaps = listSnapshots(dir);
    expect(snaps).toHaveLength(2);
    expect(snaps.every((s) => s.endsWith(".snapshot.json"))).toBe(true);
  });

  it("returns empty array if directory does not exist", () => {
    expect(listSnapshots("/no/such/dir")).toEqual([]);
  });
});

describe("resolveSnapshotPath", () => {
  it("generates a timestamped filename based on schema name", () => {
    const result = resolveSnapshotPath("./snapshots", "envcast.schema.json");
    expect(result).toContain("envcast");
    expect(result).toContain(".snapshot.json");
  });
});
