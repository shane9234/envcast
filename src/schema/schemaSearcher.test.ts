import { describe, it, expect } from 'vitest';
import { searchSchema, formatSearchResults } from './schemaSearcher';
import { EnvSchema } from './types';

const schema: EnvSchema = {
  DATABASE_URL: {
    type: 'string',
    required: true,
    description: 'Primary database connection URL',
  },
  DB_PORT: {
    type: 'number',
    required: false,
    defaultValue: 5432,
    description: 'Database port number',
  },
  API_KEY: {
    type: 'string',
    required: true,
    secret: true,
    description: 'External API authentication key',
  },
  DEBUG: {
    type: 'boolean',
    required: false,
    defaultValue: false,
  },
};

describe('searchSchema', () => {
  it('returns empty array for empty query', () => {
    expect(searchSchema(schema, { query: '' })).toEqual([]);
    expect(searchSchema(schema, { query: '   ' })).toEqual([]);
  });

  it('matches by key (case-insensitive by default)', () => {
    const results = searchSchema(schema, { query: 'db' });
    expect(results).toHaveLength(2);
    const keys = results.map((r) => r.key);
    expect(keys).toContain('DATABASE_URL');
    expect(keys).toContain('DB_PORT');
  });

  it('matches by description', () => {
    const results = searchSchema(schema, { query: 'database', fields: ['description'] });
    expect(results).toHaveLength(2);
  });

  it('matches by type', () => {
    const results = searchSchema(schema, { query: 'boolean', fields: ['type'] });
    expect(results).toHaveLength(1);
    expect(results[0].key).toBe('DEBUG');
  });

  it('matches by defaultValue', () => {
    const results = searchSchema(schema, { query: '5432', fields: ['defaultValue'] });
    expect(results).toHaveLength(1);
    expect(results[0].key).toBe('DB_PORT');
  });

  it('respects caseSensitive option', () => {
    const insensitive = searchSchema(schema, { query: 'api', caseSensitive: false });
    expect(insensitive).toHaveLength(1);

    const sensitive = searchSchema(schema, { query: 'api', caseSensitive: true });
    expect(sensitive).toHaveLength(0);
  });

  it('reports correct matchedIn fields', () => {
    const results = searchSchema(schema, { query: 'database' });
    const dbUrl = results.find((r) => r.key === 'DATABASE_URL');
    expect(dbUrl?.matchedIn).toContain('key');
    expect(dbUrl?.matchedIn).toContain('description');
  });
});

describe('formatSearchResults', () => {
  it('returns no-results message when empty', () => {
    expect(formatSearchResults([])).toBe('No results found.');
  });

  it('includes key and matched fields in output', () => {
    const results = searchSchema(schema, { query: 'API_KEY' });
    const output = formatSearchResults(results);
    expect(output).toContain('API_KEY');
    expect(output).toContain('key');
    expect(output).toContain('Found 1 result(s)');
  });

  it('includes description when present', () => {
    const results = searchSchema(schema, { query: 'DATABASE_URL' });
    const output = formatSearchResults(results);
    expect(output).toContain('Primary database connection URL');
  });
});
