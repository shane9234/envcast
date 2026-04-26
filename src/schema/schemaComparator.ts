import { EnvSchema } from './types';
import { diffSchemas, isSchemaDiffEmpty, SchemaDiff } from './schemaDiff';

export interface CompareResult {
  identical: boolean;
  diff: SchemaDiff;
  summary: string[];
}

/**
 * Compares two schemas and returns a structured comparison result.
 */
export function compareSchemas(
  schemaA: EnvSchema,
  schemaB: EnvSchema,
  labelA = 'Schema A',
  labelB = 'Schema B'
): CompareResult {
  const diff = diffSchemas(schemaA, schemaB);
  const identical = isSchemaDiffEmpty(diff);
  const summary: string[] = [];

  if (identical) {
    summary.push(`${labelA} and ${labelB} are identical.`);
    return { identical, diff, summary };
  }

  if (diff.added.length > 0) {
    summary.push(
      `Fields only in ${labelB}: ${diff.added.map((f) => f.key).join(', ')}`
    );
  }

  if (diff.removed.length > 0) {
    summary.push(
      `Fields only in ${labelA}: ${diff.removed.map((f) => f.key).join(', ')}`
    );
  }

  if (diff.changed.length > 0) {
    for (const change of diff.changed) {
      const parts: string[] = [];
      if (change.before.type !== change.after.type) {
        parts.push(`type: ${change.before.type} → ${change.after.type}`);
      }
      if (change.before.required !== change.after.required) {
        parts.push(`required: ${change.before.required} → ${change.after.required}`);
      }
      if (change.before.secret !== change.after.secret) {
        parts.push(`secret: ${change.before.secret} → ${change.after.secret}`);
      }
      summary.push(`Field "${change.key}" changed — ${parts.join(', ')}`);
    }
  }

  return { identical, diff, summary };
}

/**
 * Formats a CompareResult as a human-readable string.
 */
export function formatCompareResult(result: CompareResult): string {
  return result.summary.join('\n');
}
