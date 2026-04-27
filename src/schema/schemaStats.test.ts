import { computeSchemaStats, formatStats } from './schemaStats';
import { EnvSchema } from './types';

const fullSchema: EnvSchema = {
  DATABASE_URL: {
    type: 'string',
    required: true,
    secret: true,
    description: 'Primary database connection string',
    pattern: '^postgres://',
  },
  PORT: {
    type: 'number',
    required: true,
    default: '3000',
    description: 'Server port',
  },
  DEBUG: {
    type: 'boolean',
    required: false,
    default: 'false',
  },
  API_KEY: {
    type: 'string',
    secret: true,
    description: 'External API key',
  },
};

describe('computeSchemaStats', () => {
  it('returns zero stats for empty schema', () => {
    const stats = computeSchemaStats({});
    expect(stats.totalFields).toBe(0);
    expect(stats.coverageScore).toBe(0);
    expect(stats.fieldsByType).toEqual({});
  });

  it('counts total fields correctly', () => {
    const stats = computeSchemaStats(fullSchema);
    expect(stats.totalFields).toBe(4);
  });

  it('counts required and optional fields', () => {
    const stats = computeSchemaStats(fullSchema);
    expect(stats.requiredFields).toBe(2);
    expect(stats.optionalFields).toBe(2);
  });

  it('counts secret fields', () => {
    const stats = computeSchemaStats(fullSchema);
    expect(stats.secretFields).toBe(2);
  });

  it('counts fields with defaults', () => {
    const stats = computeSchemaStats(fullSchema);
    expect(stats.withDefault).toBe(2);
  });

  it('counts fields with descriptions', () => {
    const stats = computeSchemaStats(fullSchema);
    expect(stats.withDescription).toBe(3);
  });

  it('counts fields with patterns', () => {
    const stats = computeSchemaStats(fullSchema);
    expect(stats.withPattern).toBe(1);
  });

  it('groups fields by type', () => {
    const stats = computeSchemaStats(fullSchema);
    expect(stats.fieldsByType['string']).toBe(2);
    expect(stats.fieldsByType['number']).toBe(1);
    expect(stats.fieldsByType['boolean']).toBe(1);
  });

  it('computes a coverage score between 0 and 100', () => {
    const stats = computeSchemaStats(fullSchema);
    expect(stats.coverageScore).toBeGreaterThan(0);
    expect(stats.coverageScore).toBeLessThanOrEqual(100);
  });
});

describe('formatStats', () => {
  it('includes all key labels in output', () => {
    const stats = computeSchemaStats(fullSchema);
    const output = formatStats(stats);
    expect(output).toContain('Total fields');
    expect(output).toContain('Required');
    expect(output).toContain('Secrets');
    expect(output).toContain('Coverage score');
    expect(output).toContain('Fields by type');
  });

  it('includes type breakdown', () => {
    const stats = computeSchemaStats(fullSchema);
    const output = formatStats(stats);
    expect(output).toContain('string: 2');
    expect(output).toContain('number: 1');
  });
});
