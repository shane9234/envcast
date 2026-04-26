import { compareSchemas, formatCompareResult } from './schemaComparator';
import { EnvSchema } from './types';

const baseSchema: EnvSchema = {
  DATABASE_URL: { type: 'string', required: true, secret: true },
  PORT: { type: 'number', required: false },
};

describe('compareSchemas', () => {
  it('returns identical=true when schemas are the same', () => {
    const result = compareSchemas(baseSchema, baseSchema);
    expect(result.identical).toBe(true);
    expect(result.diff.added).toHaveLength(0);
    expect(result.diff.removed).toHaveLength(0);
    expect(result.diff.changed).toHaveLength(0);
    expect(result.summary[0]).toMatch(/identical/);
  });

  it('detects added fields in schemaB', () => {
    const schemaB: EnvSchema = {
      ...baseSchema,
      NEW_KEY: { type: 'string', required: false },
    };
    const result = compareSchemas(baseSchema, schemaB);
    expect(result.identical).toBe(false);
    expect(result.diff.added.map((f) => f.key)).toContain('NEW_KEY');
    expect(result.summary.some((s) => s.includes('NEW_KEY'))).toBe(true);
  });

  it('detects removed fields in schemaB', () => {
    const schemaB: EnvSchema = {
      DATABASE_URL: { type: 'string', required: true, secret: true },
    };
    const result = compareSchemas(baseSchema, schemaB, 'Old', 'New');
    expect(result.identical).toBe(false);
    expect(result.diff.removed.map((f) => f.key)).toContain('PORT');
    expect(result.summary.some((s) => s.includes('PORT'))).toBe(true);
  });

  it('detects changed field type', () => {
    const schemaB: EnvSchema = {
      ...baseSchema,
      PORT: { type: 'string', required: false },
    };
    const result = compareSchemas(baseSchema, schemaB);
    expect(result.identical).toBe(false);
    const portChange = result.diff.changed.find((c) => c.key === 'PORT');
    expect(portChange).toBeDefined();
    expect(result.summary.some((s) => s.includes('type: number → string'))).toBe(true);
  });

  it('detects changed required flag', () => {
    const schemaB: EnvSchema = {
      ...baseSchema,
      PORT: { type: 'number', required: true },
    };
    const result = compareSchemas(baseSchema, schemaB);
    expect(result.summary.some((s) => s.includes('required: false → true'))).toBe(true);
  });

  it('uses custom labels in summary', () => {
    const result = compareSchemas(baseSchema, baseSchema, 'v1', 'v2');
    expect(result.summary[0]).toMatch(/v1.*v2/);
  });
});

describe('formatCompareResult', () => {
  it('returns a newline-joined string of summary lines', () => {
    const schemaB: EnvSchema = {
      ...baseSchema,
      EXTRA: { type: 'boolean', required: false },
    };
    const result = compareSchemas(baseSchema, schemaB);
    const output = formatCompareResult(result);
    expect(typeof output).toBe('string');
    expect(output).toContain('EXTRA');
  });
});
