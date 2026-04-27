import { lintSchema, lintField } from './schemaLinter';
import { EnvSchema } from './types';

describe('lintField', () => {
  it('warns when description is missing', () => {
    const issues = lintField('MY_VAR', { type: 'string', required: true });
    expect(issues.some((i) => i.message.includes('missing a description'))).toBe(true);
  });

  it('warns when required is not declared', () => {
    const issues = lintField('MY_VAR', { type: 'string', description: 'A var' });
    expect(issues.some((i) => i.message.includes('required'))).toBe(true);
  });

  it('errors when enum type has no values', () => {
    const issues = lintField('MY_VAR', { type: 'enum', description: 'A var', required: true });
    expect(issues.some((i) => i.severity === 'error' && i.message.includes('no "values"'))).toBe(true);
  });

  it('passes valid enum field', () => {
    const issues = lintField('MY_VAR', {
      type: 'enum',
      description: 'An enum',
      required: true,
      values: ['a', 'b'],
    });
    expect(issues.filter((i) => i.severity === 'error')).toHaveLength(0);
  });

  it('warns when required=true and default is set', () => {
    const issues = lintField('MY_VAR', {
      type: 'string',
      description: 'A var',
      required: true,
      default: 'fallback',
    });
    expect(issues.some((i) => i.message.includes('default value'))).toBe(true);
  });

  it('warns when field name is not SCREAMING_SNAKE_CASE', () => {
    const issues = lintField('myVar', { type: 'string', description: 'A var', required: false });
    expect(issues.some((i) => i.message.includes('SCREAMING_SNAKE_CASE'))).toBe(true);
  });

  it('does not warn for valid SCREAMING_SNAKE_CASE name', () => {
    const issues = lintField('MY_VAR_2', { type: 'string', description: 'A var', required: false });
    expect(issues.some((i) => i.message.includes('SCREAMING_SNAKE_CASE'))).toBe(false);
  });
});

describe('lintSchema', () => {
  it('returns valid=true for a clean schema', () => {
    const schema: EnvSchema = {
      API_KEY: { type: 'string', description: 'API key', required: true },
      PORT: { type: 'number', description: 'Server port', required: false, default: '3000' },
    };
    const result = lintSchema(schema);
    expect(result.valid).toBe(true);
  });

  it('returns valid=false when there are errors', () => {
    const schema: EnvSchema = {
      MODE: { type: 'enum', description: 'App mode', required: true },
    };
    const result = lintSchema(schema);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.severity === 'error')).toBe(true);
  });

  it('collects issues from multiple fields', () => {
    const schema: EnvSchema = {
      api_key: { type: 'string' },
      DB_HOST: { type: 'string', description: 'DB host', required: true },
    };
    const result = lintSchema(schema);
    expect(result.issues.length).toBeGreaterThan(1);
  });
});
