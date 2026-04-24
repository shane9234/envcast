import type {
  EnvVarSchema,
  EnvSchema,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  EnvVarType,
} from './types';

describe('EnvVarSchema type', () => {
  it('should accept a minimal valid schema entry', () => {
    const schema: EnvVarSchema = {
      type: 'string',
    };
    expect(schema.type).toBe('string');
    expect(schema.required).toBeUndefined();
  });

  it('should accept a fully specified schema entry', () => {
    const schema: EnvVarSchema = {
      type: 'number',
      required: true,
      default: '8080',
      description: 'Server port',
      allowedValues: ['8080', '3000'],
      min: 1024,
      max: 65535,
    };
    expect(schema.type).toBe('number');
    expect(schema.min).toBe(1024);
    expect(schema.max).toBe(65535);
  });

  it('should accept all valid EnvVarType values', () => {
    const types: EnvVarType[] = ['string', 'number', 'boolean', 'url', 'email', 'port'];
    types.forEach((type) => {
      const schema: EnvVarSchema = { type };
      expect(schema.type).toBe(type);
    });
  });
});

describe('EnvSchema type', () => {
  it('should accept a map of variable names to schemas', () => {
    const schema: EnvSchema = {
      DATABASE_URL: { type: 'url', required: true, description: 'Primary database connection' },
      PORT: { type: 'port', default: '3000' },
      DEBUG: { type: 'boolean', required: false },
    };
    expect(Object.keys(schema)).toHaveLength(3);
    expect(schema['DATABASE_URL'].type).toBe('url');
  });
});

describe('ValidationResult type', () => {
  it('should represent a passing validation result', () => {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
    };
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should represent a failing validation result with errors', () => {
    const error: ValidationError = {
      variable: 'DATABASE_URL',
      message: 'Required variable is missing',
      file: '.env',
    };
    const warning: ValidationWarning = {
      variable: 'LOG_LEVEL',
      message: 'Variable not defined in schema',
    };
    const result: ValidationResult = {
      valid: false,
      errors: [error],
      warnings: [warning],
    };
    expect(result.valid).toBe(false);
    expect(result.errors[0].variable).toBe('DATABASE_URL');
    expect(result.warnings[0].file).toBeUndefined();
  });
});
