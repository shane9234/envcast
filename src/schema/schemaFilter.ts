import { EnvSchema, FieldSchema } from "./types";

export interface FilterOptions {
  required?: boolean;
  types?: string[];
  tags?: string[];
  hasDefault?: boolean;
  hasDescription?: boolean;
  secret?: boolean;
  pattern?: string;
}

export interface FilterResult {
  matched: EnvSchema;
  total: number;
  matchCount: number;
}

export function filterSchema(
  schema: EnvSchema,
  options: FilterOptions
): FilterResult {
  const matched: EnvSchema = {};

  for (const [key, field] of Object.entries(schema)) {
    if (matchesFilter(key, field, options)) {
      matched[key] = field;
    }
  }

  return {
    matched,
    total: Object.keys(schema).length,
    matchCount: Object.keys(matched).length,
  };
}

function matchesFilter(
  key: string,
  field: FieldSchema,
  options: FilterOptions
): boolean {
  if (options.required !== undefined && field.required !== options.required) {
    return false;
  }

  if (options.types && options.types.length > 0) {
    if (!options.types.includes(field.type)) return false;
  }

  if (options.tags && options.tags.length > 0) {
    const fieldTags: string[] = (field as any).tags ?? [];
    const hasTag = options.tags.some((t) => fieldTags.includes(t));
    if (!hasTag) return false;
  }

  if (options.hasDefault !== undefined) {
    const has = field.default !== undefined;
    if (has !== options.hasDefault) return false;
  }

  if (options.hasDescription !== undefined) {
    const has =
      typeof field.description === "string" && field.description.length > 0;
    if (has !== options.hasDescription) return false;
  }

  if (options.secret !== undefined) {
    if (!!field.secret !== options.secret) return false;
  }

  if (options.pattern) {
    const regex = new RegExp(options.pattern, "i");
    if (!regex.test(key)) return false;
  }

  return true;
}

export function formatFilterResult(result: FilterResult): string {
  const lines: string[] = [
    `Matched ${result.matchCount} of ${result.total} fields:`,
    "",
  ];
  for (const [key, field] of Object.entries(result.matched)) {
    const meta = [
      field.type,
      field.required ? "required" : "optional",
      field.secret ? "secret" : null,
      field.default !== undefined ? `default=${field.default}` : null,
    ]
      .filter(Boolean)
      .join(", ");
    lines.push(`  ${key} (${meta})`);
    if (field.description) lines.push(`    ${field.description}`);
  }
  return lines.join("\n");
}
