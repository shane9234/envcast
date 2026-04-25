import { EnvSchema, EnvFieldSchema } from './types';

/**
 * Infers an EnvSchema from a flat record of environment variable key-value pairs.
 * Attempts to detect types and flags common patterns (secrets, optional fields).
 */
export function inferSchema(env: Record<string, string>): EnvSchema {
  const fields: EnvSchema['fields'] = {};

  for (const [key, value] of Object.entries(env)) {
    fields[key] = inferField(key, value);
  }

  return { fields };
}

export function inferField(key: string, value: string): EnvFieldSchema {
  const type = inferType(value);
  const secret = isLikelySecret(key);
  const description = `Auto-inferred field for ${key}`;

  const field: EnvFieldSchema = { type, description };

  if (secret) {
    field.secret = true;
  }

  if (value === '') {
    field.optional = true;
  }

  if (type === 'enum') {
    field.enum = value.split(',').map((v) => v.trim()).filter(Boolean);
    field.type = 'string';
  }

  return field;
}

export function inferType(value: string): EnvFieldSchema['type'] {
  if (value === 'true' || value === 'false') {
    return 'boolean';
  }

  if (value !== '' && !isNaN(Number(value))) {
    return 'number';
  }

  const commaSeparated = value.split(',');
  if (
    commaSeparated.length > 1 &&
    commaSeparated.every((v) => v.trim().length > 0)
  ) {
    return 'enum';
  }

  return 'string';
}

export function isLikelySecret(key: string): boolean {
  const secretPatterns = [
    /secret/i,
    /password/i,
    /passwd/i,
    /token/i,
    /api[_-]?key/i,
    /private[_-]?key/i,
    /auth/i,
    /credential/i,
    /cert/i,
  ];
  return secretPatterns.some((pattern) => pattern.test(key));
}
