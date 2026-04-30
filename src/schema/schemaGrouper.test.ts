import { groupSchema, groupByPrefix, groupByTag, groupByRequired, formatGroupedSchema } from './schemaGrouper';
import { EnvSchema } from './types';

const schema: EnvSchema = {
  DB_HOST: { type: 'string', required: true, description: 'Database host', tags: ['database'] },
  DB_PORT: { type: 'number', required: true, description: 'Database port', tags: ['database'] },
  APP_NAME: { type: 'string', required: true, description: 'App name', tags: ['app'] },
  APP_DEBUG: { type: 'boolean', required: false, description: 'Debug mode', tags: ['app'] },
  SECRET_KEY: { type: 'string', required: true, secret: true, description: 'Secret key' },
  OPTIONAL_VAR: { type: 'string', required: false, description: 'Optional variable' },
};

describe('groupByPrefix', () => {
  it('groups fields by their prefix', () => {
    const result = groupByPrefix(schema);
    expect(result['DB']).toBeDefined();
    expect(Object.keys(result['DB'])).toContain('DB_HOST');
    expect(Object.keys(result['DB'])).toContain('DB_PORT');
    expect(result['APP']).toBeDefined();
    expect(Object.keys(result['APP'])).toContain('APP_NAME');
  });

  it('places unprefixed keys under OTHER', () => {
    const result = groupByPrefix({ SIMPLE: { type: 'string', required: false } });
    expect(result['OTHER']).toBeDefined();
    expect(Object.keys(result['OTHER'])).toContain('SIMPLE');
  });
});

describe('groupByTag', () => {
  it('groups fields by tag', () => {
    const result = groupByTag(schema);
    expect(result['database']).toBeDefined();
    expect(Object.keys(result['database'])).toContain('DB_HOST');
    expect(result['app']).toBeDefined();
  });

  it('places untagged fields under untagged', () => {
    const result = groupByTag(schema);
    expect(result['untagged']).toBeDefined();
    expect(Object.keys(result['untagged'])).toContain('SECRET_KEY');
  });
});

describe('groupByRequired', () => {
  it('separates required and optional fields', () => {
    const result = groupByRequired(schema);
    expect(result['required']).toBeDefined();
    expect(result['optional']).toBeDefined();
    expect(Object.keys(result['required'])).toContain('DB_HOST');
    expect(Object.keys(result['optional'])).toContain('APP_DEBUG');
  });
});

describe('groupSchema', () => {
  it('groups by prefix by default', () => {
    const result = groupSchema(schema, 'prefix');
    expect(result['DB']).toBeDefined();
  });

  it('groups by tag', () => {
    const result = groupSchema(schema, 'tag');
    expect(result['database']).toBeDefined();
  });

  it('groups by required', () => {
    const result = groupSchema(schema, 'required');
    expect(result['required']).toBeDefined();
    expect(result['optional']).toBeDefined();
  });
});

describe('formatGroupedSchema', () => {
  it('returns a non-empty string', () => {
    const grouped = groupSchema(schema, 'prefix');
    const output = formatGroupedSchema(grouped);
    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
    expect(output).toContain('DB');
  });

  it('includes field names in output', () => {
    const grouped = groupSchema(schema, 'prefix');
    const output = formatGroupedSchema(grouped);
    expect(output).toContain('DB_HOST');
    expect(output).toContain('APP_NAME');
  });
});
