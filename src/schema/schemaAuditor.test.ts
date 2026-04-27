import { describe, it, expect } from "vitest";
import { auditSchema, auditField } from "./schemaAuditor";
import { EnvSchema } from "./types";

const goodSchema: EnvSchema = {
  DATABASE_URL: {
    type: "string",
    required: true,
    description: "Primary database connection string",
    secret: false,
  },
};

const badSchema: EnvSchema = {
  TOKEN: {
    type: "string",
    secret: true,
    defaultValue: "dev-token",
  } as any,
  UNNAMED: {} as any,
};

describe("auditField", () => {
  it("returns no issues for a well-defined field", () => {
    const issues = auditField("DATABASE_URL", goodSchema["DATABASE_URL"]);
    expect(issues).toHaveLength(0);
  });

  it("warns when description is missing", () => {
    const issues = auditField("TOKEN", badSchema["TOKEN"]);
    const codes = issues.map((i) => i.code);
    expect(codes).toContain("MISSING_DESCRIPTION");
  });

  it("errors when type is missing", () => {
    const issues = auditField("UNNAMED", badSchema["UNNAMED"]);
    const codes = issues.map((i) => i.code);
    expect(codes).toContain("MISSING_TYPE");
  });

  it("warns when secret field has a default value", () => {
    const issues = auditField("TOKEN", badSchema["TOKEN"]);
    const codes = issues.map((i) => i.code);
    expect(codes).toContain("SECRET_WITH_DEFAULT");
  });

  it("emits info when required is not declared", () => {
    const issues = auditField("TOKEN", badSchema["TOKEN"]);
    const codes = issues.map((i) => i.code);
    expect(codes).toContain("IMPLICIT_REQUIRED");
  });
});

describe("auditSchema", () => {
  it("passes a clean schema with score 100", () => {
    const result = auditSchema(goodSchema);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
    expect(result.issues).toHaveLength(0);
  });

  it("fails a schema with errors", () => {
    const result = auditSchema(badSchema);
    expect(result.passed).toBe(false);
    expect(result.score).toBeLessThan(100);
  });

  it("collects issues from all fields", () => {
    const result = auditSchema(badSchema);
    const fields = result.issues.map((i) => i.field);
    expect(fields).toContain("TOKEN");
    expect(fields).toContain("UNNAMED");
  });

  it("returns score 100 for empty schema", () => {
    const result = auditSchema({});
    expect(result.score).toBe(100);
    expect(result.passed).toBe(true);
  });
});
