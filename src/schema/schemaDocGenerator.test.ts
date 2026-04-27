import { describe, it, expect } from "vitest";
import {
  generateSchemaDoc,
  buildDocSection,
  docToMarkdown,
  docToText,
} from "./schemaDocGenerator";
import { EnvSchema } from "./types";

const sampleSchema: EnvSchema = {
  DATABASE_URL: {
    type: "string",
    required: true,
    description: "Postgres connection string",
    example: "postgres://localhost/db",
    secret: true,
  },
  PORT: {
    type: "number",
    required: false,
    default: 3000,
    description: "Server port",
  },
  FEATURE_FLAG: {
    type: "boolean",
    required: false,
    default: false,
  },
};

describe("generateSchemaDoc", () => {
  it("generates doc with correct number of sections", () => {
    const doc = generateSchemaDoc(sampleSchema);
    expect(doc.sections).toHaveLength(3);
  });

  it("uses provided title", () => {
    const doc = generateSchemaDoc(sampleSchema, "My App Env");
    expect(doc.title).toBe("My App Env");
  });

  it("sets generatedAt as ISO string", () => {
    const doc = generateSchemaDoc(sampleSchema);
    expect(() => new Date(doc.generatedAt)).not.toThrow();
  });
});

describe("buildDocSection", () => {
  it("maps field definition correctly", () => {
    const section = buildDocSection("DATABASE_URL", sampleSchema.DATABASE_URL);
    expect(section.field).toBe("DATABASE_URL");
    expect(section.type).toBe("string");
    expect(section.required).toBe(true);
    expect(section.secret).toBe(true);
    expect(section.example).toBe("postgres://localhost/db");
  });

  it("converts default value to string", () => {
    const section = buildDocSection("PORT", sampleSchema.PORT);
    expect(section.defaultValue).toBe("3000");
  });

  it("handles missing optional fields", () => {
    const section = buildDocSection("FEATURE_FLAG", sampleSchema.FEATURE_FLAG);
    expect(section.description).toBeUndefined();
    expect(section.example).toBeUndefined();
    expect(section.secret).toBe(false);
  });
});

describe("docToMarkdown", () => {
  it("includes title as heading", () => {
    const doc = generateSchemaDoc(sampleSchema, "Test Env");
    const md = docToMarkdown(doc);
    expect(md).toContain("# Test Env");
  });

  it("includes table header", () => {
    const doc = generateSchemaDoc(sampleSchema);
    const md = docToMarkdown(doc);
    expect(md).toContain("| Variable |");
  });

  it("includes field rows", () => {
    const doc = generateSchemaDoc(sampleSchema);
    const md = docToMarkdown(doc);
    expect(md).toContain("`DATABASE_URL`");
    expect(md).toContain("`PORT`");
  });

  it("includes examples section when examples exist", () => {
    const doc = generateSchemaDoc(sampleSchema);
    const md = docToMarkdown(doc);
    expect(md).toContain("## Examples");
    expect(md).toContain("postgres://localhost/db");
  });
});

describe("docToText", () => {
  it("includes field names", () => {
    const doc = generateSchemaDoc(sampleSchema);
    const text = docToText(doc);
    expect(text).toContain("DATABASE_URL");
    expect(text).toContain("PORT");
  });

  it("includes type info", () => {
    const doc = generateSchemaDoc(sampleSchema);
    const text = docToText(doc);
    expect(text).toContain("Type     : string");
  });

  it("marks secret fields", () => {
    const doc = generateSchemaDoc(sampleSchema);
    const text = docToText(doc);
    expect(text).toContain("Secret   : true");
  });
});
