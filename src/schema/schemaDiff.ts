import { EnvSchema, SchemaField } from './types';

export interface SchemaDiffResult {
  added: string[];
  removed: string[];
  changed: SchemaDiffChange[];
}

export interface SchemaDiffChange {
  key: string;
  from: Partial<SchemaField>;
  to: Partial<SchemaField>;
}

/**
 * Compares two schemas and returns the differences between them.
 */
export function diffSchemas(
  oldSchema: EnvSchema,
  newSchema: EnvSchema
): SchemaDiffResult {
  const oldKeys = new Set(Object.keys(oldSchema));
  const newKeys = new Set(Object.keys(newSchema));

  const added = [...newKeys].filter((k) => !oldKeys.has(k));
  const removed = [...oldKeys].filter((k) => !newKeys.has(k));
  const changed: SchemaDiffChange[] = [];

  for (const key of oldKeys) {
    if (!newKeys.has(key)) continue;

    const oldField = oldSchema[key];
    const newField = newSchema[key];
    const diff = getFieldDiff(oldField, newField);

    if (diff) {
      changed.push({ key, from: diff.from, to: diff.to });
    }
  }

  return { added, removed, changed };
}

function getFieldDiff(
  oldField: SchemaField,
  newField: SchemaField
): { from: Partial<SchemaField>; to: Partial<SchemaField> } | null {
  const from: Partial<SchemaField> = {};
  const to: Partial<SchemaField> = {};

  const keys: (keyof SchemaField)[] = ['type', 'required', 'secret', 'description', 'default'];

  for (const k of keys) {
    if (oldField[k] !== newField[k]) {
      (from as Record<string, unknown>)[k] = oldField[k];
      (to as Record<string, unknown>)[k] = newField[k];
    }
  }

  return Object.keys(from).length > 0 ? { from, to } : null;
}

/**
 * Returns true if the diff has no differences.
 */
export function isSchemaDiffEmpty(diff: SchemaDiffResult): boolean {
  return diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0;
}
