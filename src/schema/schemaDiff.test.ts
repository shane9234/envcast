import { diffSchemas, isSchemaDiffEmpty } from './schemaDiff';
import { EnvSchema } from './types';

const baseSchema: EnvSchema = {
  API_KEY: { type: 'string', required: true, secret: true },
  PORT: { type: 'number', required: false, default: '3000' },
  DEBUG: { type: 'boolean', required: false },
};

describe('diffSchemas', () => {
  it('returns empty diff for identical schemas', () => {
    const diff = diffSchemas(baseSchema, { ...baseSchema });
    expect(diff.added).toEqual([]);
    expect(diff.removed).toEqual([]);
    expect(diff.changed).toEqual([]);
  });

  it('detects added keys', () => {
    const newSchema: EnvSchema = {
      ...baseSchema,
      NEW_VAR: { type: 'string', required: false },
    };
    const diff = diffSchemas(baseSchema, newSchema);
    expect(diff.added).toContain('NEW_VAR');
    expect(diff.removed).toEqual([]);
  });

  it('detects removed keys', () => {
    const newSchema: EnvSchema = {
      API_KEY: baseSchema.API_KEY,
    };
    const diff = diffSchemas(baseSchema, newSchema);
    expect(diff.removed).toContain('PORT');
    expect(diff.removed).toContain('DEBUG');
  });

  it('detects changed field type', () => {
    const newSchema: EnvSchema = {
      ...baseSchema,
      PORT: { type: 'string', required: false, default: '3000' },
    };
    const diff = diffSchemas(baseSchema, newSchema);
    expect(diff.changed).toHaveLength(1);
    expect(diff.changed[0].key).toBe('PORT');
    expect(diff.changed[0].from.type).toBe('number');
    expect(diff.changed[0].to.type).toBe('string');
  });

  it('detects changed required flag', () => {
    const newSchema: EnvSchema = {
      ...baseSchema,
      DEBUG: { type: 'boolean', required: true },
    };
    const diff = diffSchemas(baseSchema, newSchema);
    expect(diff.changed[0].key).toBe('DEBUG');
    expect(diff.changed[0].from.required).toBe(false);
    expect(diff.changed[0].to.required).toBe(true);
  });

  it('handles multiple changes at once', () => {
    const newSchema: EnvSchema = {
      API_KEY: { type: 'string', required: false, secret: false },
      EXTRA: { type: 'string', required: true },
    };
    const diff = diffSchemas(baseSchema, newSchema);
    expect(diff.added).toContain('EXTRA');
    expect(diff.removed).toContain('PORT');
    expect(diff.removed).toContain('DEBUG');
    expect(diff.changed[0].key).toBe('API_KEY');
  });
});

describe('isSchemaDiffEmpty', () => {
  it('returns true when no differences', () => {
    expect(isSchemaDiffEmpty({ added: [], removed: [], changed: [] })).toBe(true);
  });

  it('returns false when there are differences', () => {
    expect(isSchemaDiffEmpty({ added: ['X'], removed: [], changed: [] })).toBe(false);
  });
});
