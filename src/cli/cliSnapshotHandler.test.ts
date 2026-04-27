import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { handleSnapshot } from "./cliSnapshotHandler";
import { CliOptions } from "./cliOptions";

function writeTempSchema(dir: string, name: string, content: object): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
  return filePath;
}

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envcast-cli-snap-"));
}

const sampleSchema = {
  PORT: { type: "number", required: false },
  API_KEY: { type: "string", required: true, secret: true },
};

describe("handleSnapshot", () => {
  let logs: string[];
  beforeEach(() => {
    logs = [];
    jest.spyOn(console, "log").mockImplementation((msg) => logs.push(msg));
  });
  afterEach(() => jest.restoreAllMocks());

  it("creates a snapshot file", async () => {
    const dir = makeTempDir();
    const schemaPath = writeTempSchema(dir, "envcast.schema.json", sampleSchema);
    const snapshotDir = path.join(dir, "snapshots");
    const opts: CliOptions = { schema: schemaPath, output: snapshotDir };
    await handleSnapshot(opts);
    expect(logs.some((l) => l.includes("Snapshot saved"))).toBe(true);
    const files = fs.readdirSync(snapshotDir);
    expect(files.some((f) => f.endsWith(".snapshot.json"))).toBe(true);
  });

  it("lists snapshots in a directory", async () => {
    const dir = makeTempDir();
    const snapshotDir = path.join(dir, "snaps");
    fs.mkdirSync(snapshotDir);
    fs.writeFileSync(path.join(snapshotDir, "a.snapshot.json"), "{}");
    const opts: CliOptions = { output: snapshotDir, list: true };
    await handleSnapshot(opts);
    expect(logs.some((l) => l.includes("a.snapshot.json"))).toBe(true);
  });

  it("reports no changes when comparing identical schemas", async () => {
    const dir = makeTempDir();
    const schemaPath = writeTempSchema(dir, "envcast.schema.json", sampleSchema);
    const snapshotPath = path.join(dir, "test.snapshot.json");
    const snapshot = {
      timestamp: new Date().toISOString(),
      schemaPath,
      content: sampleSchema,
    };
    fs.writeFileSync(snapshotPath, JSON.stringify(snapshot));
    const opts: CliOptions = { schema: schemaPath, compare: snapshotPath };
    await handleSnapshot(opts);
    expect(logs.some((l) => l.includes("No changes detected"))).toBe(true);
  });
});
