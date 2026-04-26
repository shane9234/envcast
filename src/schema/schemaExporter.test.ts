import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { exportSchema, serializeSchema } from "./schemaExporter";
import { EnvSchema } from "./types";

const sampleSchema: EnvSchema = {
  PORT: { type: "number", required: true, default: 3000, description: "Server port" },
  API_KEY: { type: "string", required: true, secret: true },
  DEBUG: { type: "boolean", required: false, default: false, description: "Enable debug mode" },
};

describe("serializeSchema", () => {
  it("serializes to JSON", () => {
    const result = serializeSchema(sampleSchema, "json");
    const parsed = JSON.parse(result);
    expect(parsed.PORT.type).toBe("number");
    expect(parsed.API_KEY.required).toBe(true);
  });

  it("serializes to markdown table", () => {
    const result = serializeSchema(sampleSchema, "markdown");
    expect(result).toContain("# Environment Variables Schema");
    expect(result).toContain("| PORT |");
    expect(result).toContain("| API_KEY |");
    expect(result).toContain("Server port");
    expect(result).toContain("Yes");
  });

  it("serializes to dotenv format", () => {
    const result = serializeSchema(sampleSchema, "dotenv");
    expect(result).toContain("PORT=3000");
    expect(result).toContain("# Server port");
    expect(result).toContain("# [type=number");
    expect(result).toContain("API_KEY=");
  });

  it("throws on unsupported format", () => {
    expect(() => serializeSchema(sampleSchema, "xml" as any)).toThrow(
      "Unsupported schema export format"
    );
  });
});

describe("exportSchema", () => {
  it("returns serialized content without outputPath", () => {
    const result = exportSchema(sampleSchema, "json");
    expect(JSON.parse(result).DEBUG.type).toBe("boolean");
  });

  it("writes file to disk when outputPath is provided", () => {
    const tmpFile = path.join(os.tmpdir(), `schema-export-${Date.now()}.md`);
    try {
      const result = exportSchema(sampleSchema, "markdown", tmpFile);
      expect(fs.existsSync(tmpFile)).toBe(true);
      const written = fs.readFileSync(tmpFile, "utf-8");
      expect(written).toBe(result);
      expect(written).toContain("| PORT |");
    } finally {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
  });

  it("creates nested directories if needed", () => {
    const tmpDir = path.join(os.tmpdir(), `envcast-test-${Date.now()}`, "nested");
    const tmpFile = path.join(tmpDir, "schema.json");
    try {
      exportSchema(sampleSchema, "json", tmpFile);
      expect(fs.existsSync(tmpFile)).toBe(true);
    } finally {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
      if (fs.existsSync(tmpDir)) fs.rmdirSync(tmpDir, { recursive: true } as any);
    }
  });
});
