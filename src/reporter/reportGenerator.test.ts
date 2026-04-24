import { buildEnvReport, buildMultiEnvReport } from './reportGenerator';
import { EnvSchema } from '../schema/types';
import { ValidationResult } from '../schema/schemaValidator';

const schema: EnvSchema = {
  PORT: { type: 'number', required: true },
  API_KEY: { type: 'string', required: true },
  DEBUG: { type: 'boolean', required: false },
};

const validResult: ValidationResult = { valid: true, errors: [] };
const invalidResult: ValidationResult = {
  valid: false,
  errors: [
    { key: 'PORT', message: 'Expected number, got string' },
    { key: 'API_KEY', message: 'Required variable is missing' },
  ],
};

describe('buildEnvReport', () => {
  it('marks all variables as valid when no errors', () => {
    const env = { PORT: '3000', API_KEY: 'abc123', DEBUG: 'true' };
    const report = buildEnvReport('.env', env, schema, validResult);
    expect(report.summary.valid).toBe(3);
    expect(report.summary.missing).toBe(0);
    expect(report.summary.invalid).toBe(0);
  });

  it('marks missing and invalid variables correctly', () => {
    const env = { PORT: 'not-a-number' };
    const report = buildEnvReport('.env', env, schema, invalidResult);
    expect(report.summary.invalid).toBeGreaterThan(0);
    expect(report.summary.missing).toBeGreaterThan(0);
  });

  it('flags extra variables not in schema', () => {
    const env = { PORT: '3000', API_KEY: 'key', EXTRA_VAR: 'surprise' };
    const report = buildEnvReport('.env', env, schema, validResult);
    expect(report.summary.extra).toBe(1);
    expect(report.variables.find((v) => v.key === 'EXTRA_VAR')?.status).toBe('extra');
  });

  it('masks secret values', () => {
    const env = { PORT: '3000', API_KEY: 'supersecret', DEBUG: 'false' };
    const report = buildEnvReport('.env', env, schema, validResult);
    const apiKeyVar = report.variables.find((v) => v.key === 'API_KEY');
    expect(apiKeyVar?.value).not.toBe('supersecret');
    expect(apiKeyVar?.value).toContain('***');
  });
});

describe('buildMultiEnvReport', () => {
  it('sets overallStatus to pass when all reports are clean', () => {
    const env = { PORT: '3000', API_KEY: 'abc', DEBUG: 'true' };
    const report = buildEnvReport('.env', env, schema, validResult);
    const multi = buildMultiEnvReport([report], {});
    expect(multi.overallStatus).toBe('pass');
  });

  it('sets overallStatus to fail when any report has errors', () => {
    const env = { PORT: 'bad' };
    const report = buildEnvReport('.env', env, schema, invalidResult);
    const multi = buildMultiEnvReport([report], {});
    expect(multi.overallStatus).toBe('fail');
  });

  it('includes conflicts in the report', () => {
    const env = { PORT: '3000', API_KEY: 'abc', DEBUG: 'true' };
    const report = buildEnvReport('.env', env, schema, validResult);
    const conflicts = { PORT: ['.env', '.env.local'] };
    const multi = buildMultiEnvReport([report], conflicts);
    expect(multi.conflicts).toEqual(conflicts);
  });
});
