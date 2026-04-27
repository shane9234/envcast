import { describe, it, expect } from "vitest";
import { mergeSchemas } from "./schemaMerger";
import { EnvSchema } from "./types";

const baseSchema: EnvSchema = {
  fields: {
    PORT: { type: "number", required: true, description: "Server port" },
    HOST: { type: "string", required: false },
  },
};

const overrideSchema: EnvSchema = {
  fields: {
    PORT: { type: "number", required: false, description: "Override port" },
    DEBUG: { type: "boolean", required: false },
  },
};

describe("mergeSchemas", () => {
  it("includes all fields from both schemas in union mode", () => {
    const { schema } = mergeSchemas(baseSchema, overrideSchema);
    expect(Object.keys(schema.fields)).toContain("PORT");
    expect(Object.keys(schema.fields)).toContain("HOST");
    expect(Object.keys(schema.fields)).toContain("DEBUG");
  });

  it("reports conflicts for overlapping keys", () => {
    const { conflicts } = mergeSchemas(baseSchema, overrideSchema);
    expect(conflicts).toContain("PORT");
    expect(conflicts).not.toContain("HOST");
    expect(conflicts).not.toContain("DEBUG");
  });

  it("union strategy: override wins on conflicting field properties", () => {
    const { schema } = mergeSchemas(baseSchema, overrideSchema, { strategy: "union" });
    expect(schema.fields["PORT"].description).toBe("Override port");
    expect(schema.fields["PORT"].required).toBe(false);
  });

  it("prefer-base strategy: base wins on conflict", () => {
    const { schema } = mergeSchemas(baseSchema, overrideSchema, { strategy: "prefer-base" });
    expect(schema.fields["PORT"].description).toBe("Server port");
    expect(schema.fields["PORT"].required).toBe(true);
  });

  it("prefer-override strategy: override wins on conflict", () => {
    const { schema } = mergeSchemas(baseSchema, overrideSchema, { strategy: "prefer-override" });
    expect(schema.fields["PORT"].description).toBe("Override port");
  });

  it("non-conflicting fields are preserved as-is", () => {
    const { schema } = mergeSchemas(baseSchema, overrideSchema);
    expect(schema.fields["HOST"]).toEqual({ type: "string", required: false });
    expect(schema.fields["DEBUG"]).toEqual({ type: "boolean", required: false });
  });

  it("returns empty schema when both inputs are empty", () => {
    const { schema, conflicts } = mergeSchemas({ fields: {} }, { fields: {} });
    expect(Object.keys(schema.fields)).toHaveLength(0);
    expect(conflicts).toHaveLength(0);
  });
});
