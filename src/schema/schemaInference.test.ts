import { describe, it, expect } from 'vitest';
import {
  inferSchema,
  inferField,
  inferType,
  isLikelySecret,
} from './schemaInference';

describe('inferType', () => {
  it('returns boolean for true/false strings', () => {
    expect(inferType('true')).toBe('boolean');
    expect(inferType('false')).toBe('boolean');
  });

  it('returns number for numeric strings', () => {
    expect(inferType('42')).toBe('number');
    expect(inferType('3.14')).toBe('number');
  });

  it('returns enum for comma-separated values', () => {
    expect(inferType('dev,staging,prod')).toBe('enum');
  });

  it('returns string for plain text', () => {
    expect(inferType('hello')).toBe('string');
    expect(inferType('')).toBe('string');
  });
});

describe('isLikelySecret', () => {
  it('detects secret-like keys', () => {
    expect(isLikelySecret('API_KEY')).toBe(true);
    expect(isLikelySecret('DB_PASSWORD')).toBe(true);
    expect(isLikelySecret('AUTH_TOKEN')).toBe(true);
    expect(isLikelySecret('PRIVATE_KEY')).toBe(true);
  });

  it('does not flag non-secret keys', () => {
    expect(isLikelySecret('PORT')).toBe(false);
    expect(isLikelySecret('NODE_ENV')).toBe(false);
    expect(isLikelySecret('APP_NAME')).toBe(false);
  });
});

describe('inferField', () => {
  it('marks empty values as optional', () => {
    const field = inferField('SOME_VAR', '');
    expect(field.optional).toBe(true);
  });

  it('marks secret-like keys with secret flag', () => {
    const field = inferField('DB_PASSWORD', 'hunter2');
    expect(field.secret).toBe(true);
  });

  it('infers enum type and normalizes to string with enum values', () => {
    const field = inferField('ENV', 'dev,staging,prod');
    expect(field.type).toBe('string');
    expect(field.enum).toEqual(['dev', 'staging', 'prod']);
  });

  it('infers boolean type', () => {
    const field = inferField('FEATURE_FLAG', 'true');
    expect(field.type).toBe('boolean');
  });
});

describe('inferSchema', () => {
  it('produces a schema with all keys from the env record', () => {
    const env = {
      PORT: '3000',
      DEBUG: 'false',
      API_SECRET: 'abc123',
      NODE_ENV: 'dev,staging,prod',
    };
    const schema = inferSchema(env);
    expect(Object.keys(schema.fields)).toEqual(Object.keys(env));
    expect(schema.fields['PORT'].type).toBe('number');
    expect(schema.fields['DEBUG'].type).toBe('boolean');
    expect(schema.fields['API_SECRET'].secret).toBe(true);
    expect(schema.fields['NODE_ENV'].enum).toEqual(['dev', 'staging', 'prod']);
  });

  it('returns empty fields for empty env record', () => {
    const schema = inferSchema({});
    expect(schema.fields).toEqual({});
  });
});
