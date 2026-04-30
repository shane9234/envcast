import { describe, it, expect } from "vitest";
import { filterSchema, formatFilterResult } from "./schemaFilter";
import { EnvSchema } from "./types";

const schema: EnvSchema = {
  DATABASE_URL: {
    type: "string",
    required: true,
    secret: true,
    description: "Primary database connection string",
  },
  PORT: {
    type: "number",
    required: false,
    default: "3000",
    description: "Server port",
  },
  DEBUG: {
    type: "boolean",
    required: false,
  },
  API_KEY: {
    type: "string",
    required: true,
    secret: true,
  },
};

describe("filterSchema", () => {
  it("filters by required", () => {
    const result = filterSchema(schema, { required: true });
    expect(result.matchCount).toBe(2);
    expect(result.matched).toHaveProperty("DATABASE_URL");
    expect(result.matched).toHaveProperty("API_KEY");
  });

  it("filters by type", () => {
    const result = filterSchema(schema, { types: ["number", "boolean"] });
    expect(result.matchCount).toBe(2);
    expect(result.matched).toHaveProperty("PORT");
    expect(result.matched).toHaveProperty("DEBUG");
  });

  it("filters by secret", () => {
    const result = filterSchema(schema, { secret: true });
    expect(result.matchCount).toBe(2);
    expect(result.matched).toHaveProperty("DATABASE_URL");
    expect(result.matched).toHaveProperty("API_KEY");
  });

  it("filters by hasDefault", () => {
    const result = filterSchema(schema, { hasDefault: true });
    expect(result.matchCount).toBe(1);
    expect(result.matched).toHaveProperty("PORT");
  });

  it("filters by hasDescription", () => {
    const result = filterSchema(schema, { hasDescription: true });
    expect(result.matchCount).toBe(2);
  });

  it("filters by pattern", () => {
    const result = filterSchema(schema, { pattern: "^API" });
    expect(result.matchCount).toBe(1);
    expect(result.matched).toHaveProperty("API_KEY");
  });

  it("combines multiple filters", () => {
    const result = filterSchema(schema, { required: true, secret: true });
    expect(result.matchCount).toBe(2);
  });

  it("returns total count correctly", () => {
    const result = filterSchema(schema, {});
    expect(result.total).toBe(4);
    expect(result.matchCount).toBe(4);
  });
});

describe("formatFilterResult", () => {
  it("includes matched count header", () => {
    const result = filterSchema(schema, { required: true });
    const text = formatFilterResult(result);
    expect(text).toContain("Matched 2 of 4 fields");
  });

  it("includes field names", () => {
    const result = filterSchema(schema, { types: ["number"] });
    const text = formatFilterResult(result);
    expect(text).toContain("PORT");
  });

  it("includes description when present", () => {
    const result = filterSchema(schema, { types: ["number"] });
    const text = formatFilterResult(result);
    expect(text).toContain("Server port");
  });
});
