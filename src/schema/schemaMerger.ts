import { EnvSchema, EnvFieldSchema } from "./types";

export type MergeStrategy = "prefer-base" | "prefer-override" | "union";

export interface MergeOptions {
  strategy?: MergeStrategy;
  warnOnConflict?: boolean;
}

export interface MergeResult {
  schema: EnvSchema;
  conflicts: string[];
}

/**
 * Merges two schemas together using the specified strategy.
 * - prefer-base: base fields win on conflict
 * - prefer-override: override fields win on conflict
 * - union: all fields included, override wins on conflict
 */
export function mergeSchemas(
  base: EnvSchema,
  override: EnvSchema,
  options: MergeOptions = {}
): MergeResult {
  const { strategy = "union" } = options;
  const conflicts: string[] = [];
  const merged: EnvSchema = { fields: {} };

  const baseKeys = new Set(Object.keys(base.fields));
  const overrideKeys = new Set(Object.keys(override.fields));
  const allKeys = new Set([...baseKeys, ...overrideKeys]);

  for (const key of allKeys) {
    const inBase = baseKeys.has(key);
    const inOverride = overrideKeys.has(key);

    if (inBase && inOverride) {
      conflicts.push(key);
      merged.fields[key] = resolveConflict(
        key,
        base.fields[key],
        override.fields[key],
        strategy
      );
    } else if (inBase) {
      merged.fields[key] = { ...base.fields[key] };
    } else {
      merged.fields[key] = { ...override.fields[key] };
    }
  }

  return { schema: merged, conflicts };
}

function resolveConflict(
  _key: string,
  baseField: EnvFieldSchema,
  overrideField: EnvFieldSchema,
  strategy: MergeStrategy
): EnvFieldSchema {
  if (strategy === "prefer-base") {
    return { ...baseField };
  }
  if (strategy === "prefer-override") {
    return { ...overrideField };
  }
  // union: merge fields, override wins on property conflict
  return { ...baseField, ...overrideField };
}
