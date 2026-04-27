import { EnvSchema, SchemaField } from './types';

export interface SearchOptions {
  query: string;
  fields?: Array<'key' | 'description' | 'type' | 'defaultValue'>;
  caseSensitive?: boolean;
}

export interface SearchResult {
  key: string;
  field: SchemaField;
  matchedIn: string[];
}

export function searchSchema(
  schema: EnvSchema,
  options: SearchOptions
): SearchResult[] {
  const { query, fields = ['key', 'description', 'type', 'defaultValue'], caseSensitive = false } = options;

  if (!query.trim()) return [];

  const normalize = (s: string) => (caseSensitive ? s : s.toLowerCase());
  const normalizedQuery = normalize(query);

  const results: SearchResult[] = [];

  for (const [key, field] of Object.entries(schema)) {
    const matchedIn: string[] = [];

    if (fields.includes('key') && normalize(key).includes(normalizedQuery)) {
      matchedIn.push('key');
    }

    if (
      fields.includes('description') &&
      field.description &&
      normalize(field.description).includes(normalizedQuery)
    ) {
      matchedIn.push('description');
    }

    if (
      fields.includes('type') &&
      field.type &&
      normalize(field.type).includes(normalizedQuery)
    ) {
      matchedIn.push('type');
    }

    if (
      fields.includes('defaultValue') &&
      field.defaultValue !== undefined &&
      normalize(String(field.defaultValue)).includes(normalizedQuery)
    ) {
      matchedIn.push('defaultValue');
    }

    if (matchedIn.length > 0) {
      results.push({ key, field, matchedIn });
    }
  }

  return results;
}

export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) return 'No results found.';

  const lines: string[] = [`Found ${results.length} result(s):`, ''];

  for (const result of results) {
    lines.push(`  ${result.key}`);
    lines.push(`    Type     : ${result.field.type ?? 'any'}`);
    if (result.field.description) {
      lines.push(`    Desc     : ${result.field.description}`);
    }
    lines.push(`    Matched  : ${result.matchedIn.join(', ')}`);
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}
