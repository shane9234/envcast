import { EnvSchema, EnvVarDefinition } from './types';

export interface ValidationError {
  variable: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  missing: string[];
  extra: string[];
}

export function validateEnv(
  env: Record<string, string>,
  schema: EnvSchema
): ValidationResult {
  const errors: ValidationError[] = [];
  const missing: string[] = [];
  const extra: string[] = [];

  for (const [key, def] of Object.entries(schema)) {
    const value = env[key];

    if (value === undefined || value === '') {
      if (def.required) {
        missing.push(key);
        errors.push({ variable: key, message: `Required variable "${key}" is missing.` });
      }
      continue;
    }

    const typeError = validateType(key, value, def);
    if (typeError) errors.push(typeError);

    if (def.allowedValues && !def.allowedValues.includes(value)) {
      errors.push({
        variable: key,
        message: `Variable "${key}" must be one of [${def.allowedValues.join(', ')}], got "${value}".`,
      });
    }
  }

  const schemaKeys = new Set(Object.keys(schema));
  for (const key of Object.keys(env)) {
    if (!schemaKeys.has(key)) {
      extra.push(key);
    }
  }

  return { valid: errors.length === 0, errors, missing, extra };
}

function validateType(
  key: string,
  value: string,
  def: EnvVarDefinition
): ValidationError | null {
  switch (def.type) {
    case 'number':
      if (isNaN(Number(value))) {
        return { variable: key, message: `Variable "${key}" must be a number, got "${value}".` };
      }
      break;
    case 'boolean':
      if (!['true', 'false', '1', '0'].includes(value.toLowerCase())) {
        return { variable: key, message: `Variable "${key}" must be a boolean (true/false/1/0), got "${value}".` };
      }
      break;
    case 'url':
      try {
        new URL(value);
      } catch {
        return { variable: key, message: `Variable "${key}" must be a valid URL, got "${value}".` };
      }
      break;
    case 'string':
    default:
      break;
  }
  return null;
}
