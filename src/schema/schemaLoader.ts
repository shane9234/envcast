import * as fs from 'fs';
import * as path from 'path';
import { EnvSchema } from './types';

export class SchemaLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SchemaLoadError';
  }
}

/**
 * Loads and parses a JSON schema file from the given path.
 * Validates that the schema has the expected structure.
 */
export function loadSchema(schemaPath: string): EnvSchema {
  const resolved = path.resolve(schemaPath);

  if (!fs.existsSync(resolved)) {
    throw new SchemaLoadError(`Schema file not found: ${resolved}`);
  }

  const ext = path.extname(resolved).toLowerCase();
  if (ext !== '.json') {
    throw new SchemaLoadError(`Schema file must be a .json file, got: ${ext}`);
  }

  let raw: string;
  try {
    raw = fs.readFileSync(resolved, 'utf-8');
  } catch (err) {
    throw new SchemaLoadError(`Failed to read schema file: ${(err as Error).message}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new SchemaLoadError(`Schema file contains invalid JSON: ${resolved}`);
  }

  return validateSchemaShape(parsed, resolved);
}

function validateSchemaShape(parsed: unknown, filePath: string): EnvSchema {
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new SchemaLoadError(`Schema must be a JSON object: ${filePath}`);
  }

  const schema = parsed as Record<string, unknown>;
  const result: EnvSchema = {};

  for (const [key, value] of Object.entries(schema)) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new SchemaLoadError(`Schema entry "${key}" must be an object`);
    }

    const entry = value as Record<string, unknown>;

    if (!('type' in entry)) {
      throw new SchemaLoadError(`Schema entry "${key}" is missing required field "type"`);
    }

    const allowedTypes = ['string', 'number', 'boolean', 'url', 'email'];
    if (!allowedTypes.includes(entry.type as string)) {
      throw new SchemaLoadError(
        `Schema entry "${key}" has invalid type "${entry.type}". Allowed: ${allowedTypes.join(', ')}`
      );
    }

    result[key] = entry as EnvSchema[string];
  }

  return result;
}
