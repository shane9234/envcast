import { validateEnv } from './schemaValidator';
import { EnvSchema } from './types';

const schema: EnvSchema = {
  PORT: { type: 'number', required: true, description: 'Server port' },
  NODE_ENV: { type: 'string', required: true, allowedValues: ['development', 'production', 'test'] },
  DEBUG: { type: 'boolean', required: false },
  API_URL: { type: 'url', required: false },
};

describe('validateEnv', () => {
  it('returns valid when all required vars are present and correct', () => {
    const env = { PORT: '3000', NODE_ENV: 'production' };
    const result = validateEnv(env, schema);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.missing).toHaveLength(0);
  });

  it('reports missing required variables', () => {
    const env = { NODE_ENV: 'development' };
    const result = validateEnv(env, schema);
    expect(result.valid).toBe(false);
    expect(result.missing).toContain('PORT');
    expect(result.errors[0].variable).toBe('PORT');
  });

  it('reports type error for invalid number', () => {
    const env = { PORT: 'not-a-number', NODE_ENV: 'development' };
    const result = validateEnv(env, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.variable === 'PORT')).toBe(true);
  });

  it('reports error for invalid boolean', () => {
    const env = { PORT: '3000', NODE_ENV: 'development', DEBUG: 'yes' };
    const result = validateEnv(env, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.variable === 'DEBUG')).toBe(true);
  });

  it('accepts valid boolean values', () => {
    const env = { PORT: '3000', NODE_ENV: 'development', DEBUG: 'true' };
    const result = validateEnv(env, schema);
    expect(result.valid).toBe(true);
  });

  it('reports error for disallowed enum value', () => {
    const env = { PORT: '3000', NODE_ENV: 'staging' };
    const result = validateEnv(env, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.variable === 'NODE_ENV')).toBe(true);
  });

  it('reports error for invalid URL', () => {
    const env = { PORT: '3000', NODE_ENV: 'test', API_URL: 'not-a-url' };
    const result = validateEnv(env, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.variable === 'API_URL')).toBe(true);
  });

  it('accepts a valid URL', () => {
    const env = { PORT: '8080', NODE_ENV: 'test', API_URL: 'https://api.example.com' };
    const result = validateEnv(env, schema);
    expect(result.valid).toBe(true);
  });

  it('reports extra variables not in schema', () => {
    const env = { PORT: '3000', NODE_ENV: 'development', UNKNOWN_VAR: 'foo' };
    const result = validateEnv(env, schema);
    expect(result.extra).toContain('UNKNOWN_VAR');
  });
});
