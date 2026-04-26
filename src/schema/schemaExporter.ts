import * as fs from "fs";
import * as path from "path";
import { EnvSchema, EnvFieldSchema } from "./types";

export type SchemaExportFormat = "json" | "markdown" | "dotenv";

export function exportSchema(
  schema: EnvSchema,
  format: SchemaExportFormat,
  outputPath?: string
): string {
  const content = serializeSchema(schema, format);
  if (outputPath) {
    const resolved = path.resolve(outputPath);
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
    fs.writeFileSync(resolved, content, "utf-8");
  }
  return content;
}

export function serializeSchema(
  schema: EnvSchema,
  format: SchemaExportFormat
): string {
  switch (format) {
    case "json":
      return JSON.stringify(schema, null, 2);
    case "markdown":
      return schemaToMarkdown(schema);
    case "dotenv":
      return schemaToDotenv(schema);
    default:
      throw new Error(`Unsupported schema export format: ${format}`);
  }
}

function schemaToMarkdown(schema: EnvSchema): string {
  const lines: string[] = ["# Environment Variables Schema", ""];
  lines.push("| Variable | Type | Required | Default | Description |");
  lines.push("|----------|------|----------|---------|-------------|" );
  for (const [key, field] of Object.entries(schema)) {
    const f = field as EnvFieldSchema;
    const required = f.required ? "Yes" : "No";
    const defaultVal = f.default !== undefined ? String(f.default) : "—";
    const description = f.description ?? "—";
    lines.push(`| ${key} | ${f.type} | ${required} | ${defaultVal} | ${description} |`);
  }
  return lines.join("\n") + "\n";
}

function schemaToDotenv(schema: EnvSchema): string {
  const lines: string[] = [];
  for (const [key, field] of Object.entries(schema)) {
    const f = field as EnvFieldSchema;
    if (f.description) {
      lines.push(`# ${f.description}`);
    }
    const meta: string[] = [`type=${f.type}`, `required=${f.required ?? false}`];
    if (f.default !== undefined) meta.push(`default=${f.default}`);
    lines.push(`# [${meta.join(", ")}]`);
    const value = f.default !== undefined ? String(f.default) : "";
    lines.push(`${key}=${value}`);
    lines.push("");
  }
  return lines.join("\n");
}
