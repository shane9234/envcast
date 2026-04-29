/**
 * schemaGrouper.ts
 * Groups schema fields by prefix, tag, or custom category
 * for better organization and reporting.
 */

import { EnvSchema, EnvFieldSchema } from "./types";

export interface SchemaGroup {
  name: string;
  fields: Record<string, EnvFieldSchema>;
  count: number;
}

export interface GroupedSchema {
  groups: SchemaGroup[];
  ungrouped: Record<string, EnvFieldSchema>;
  totalFields: number;
}

export type GroupStrategy = "prefix" | "tag" | "required";

/**
 * Groups schema fields using the specified strategy.
 */
export function groupSchema(
  schema: EnvSchema,
  strategy: GroupStrategy = "prefix",
  delimiter = "_"
): GroupedSchema {
  switch (strategy) {
    case "prefix":
      return groupByPrefix(schema, delimiter);
    case "tag":
      return groupByTag(schema);
    case "required":
      return groupByRequired(schema);
    default:
      throw new Error(`Unknown grouping strategy: ${strategy}`);
  }
}

/**
 * Groups fields by their common key prefix (e.g., DB_HOST, DB_PORT → "DB").
 */
function groupByPrefix(schema: EnvSchema, delimiter: string): GroupedSchema {
  const groupMap: Record<string, Record<string, EnvFieldSchema>> = {};
  const ungrouped: Record<string, EnvFieldSchema> = {};

  for (const [key, field] of Object.entries(schema)) {
    const delimIndex = key.indexOf(delimiter);
    if (delimIndex > 0) {
      const prefix = key.substring(0, delimIndex);
      if (!groupMap[prefix]) {
        groupMap[prefix] = {};
      }
      groupMap[prefix][key] = field;
    } else {
      ungrouped[key] = field;
    }
  }

  // Merge single-field prefixes into ungrouped
  const groups: SchemaGroup[] = [];
  for (const [name, fields] of Object.entries(groupMap)) {
    if (Object.keys(fields).length === 1) {
      Object.assign(ungrouped, fields);
    } else {
      groups.push({ name, fields, count: Object.keys(fields).length });
    }
  }

  groups.sort((a, b) => a.name.localeCompare(b.name));

  return {
    groups,
    ungrouped,
    totalFields: Object.keys(schema).length,
  };
}

/**
 * Groups fields by their `tags` metadata property.
 */
function groupByTag(schema: EnvSchema): GroupedSchema {
  const groupMap: Record<string, Record<string, EnvFieldSchema>> = {};
  const ungrouped: Record<string, EnvFieldSchema> = {};

  for (const [key, field] of Object.entries(schema)) {
    const tags: string[] = (field as any).tags ?? [];
    if (tags.length === 0) {
      ungrouped[key] = field;
    } else {
      // Place field in first matching tag group
      const tag = tags[0];
      if (!groupMap[tag]) {
        groupMap[tag] = {};
      }
      groupMap[tag][key] = field;
    }
  }

  const groups: SchemaGroup[] = Object.entries(groupMap).map(
    ([name, fields]) => ({ name, fields, count: Object.keys(fields).length })
  );

  groups.sort((a, b) => a.name.localeCompare(b.name));

  return { groups, ungrouped, totalFields: Object.keys(schema).length };
}

/**
 * Groups fields into "required" and "optional" buckets.
 */
function groupByRequired(schema: EnvSchema): GroupedSchema {
  const required: Record<string, EnvFieldSchema> = {};
  const optional: Record<string, EnvFieldSchema> = {};

  for (const [key, field] of Object.entries(schema)) {
    if (field.required) {
      required[key] = field;
    } else {
      optional[key] = field;
    }
  }

  const groups: SchemaGroup[] = [];
  if (Object.keys(required).length > 0) {
    groups.push({ name: "required", fields: required, count: Object.keys(required).length });
  }
  if (Object.keys(optional).length > 0) {
    groups.push({ name: "optional", fields: optional, count: Object.keys(optional).length });
  }

  return { groups, ungrouped: {}, totalFields: Object.keys(schema).length };
}

/**
 * Formats a GroupedSchema into a human-readable text summary.
 */
export function formatGroupedSchema(result: GroupedSchema): string {
  const lines: string[] = [];

  lines.push(`Total fields: ${result.totalFields}`);
  lines.push("");

  for (const group of result.groups) {
    lines.push(`[${group.name}] (${group.count} fields)`);
    for (const key of Object.keys(group.fields).sort()) {
      const field = group.fields[key];
      const req = field.required ? "required" : "optional";
      lines.push(`  ${key} — ${field.type}, ${req}`);
    }
    lines.push("");
  }

  const ungroupedKeys = Object.keys(result.ungrouped).sort();
  if (ungroupedKeys.length > 0) {
    lines.push(`[ungrouped] (${ungroupedKeys.length} fields)`);
    for (const key of ungroupedKeys) {
      const field = result.ungrouped[key];
      const req = field.required ? "required" : "optional";
      lines.push(`  ${key} — ${field.type}, ${req}`);
    }
  }

  return lines.join("\n").trimEnd();
}
