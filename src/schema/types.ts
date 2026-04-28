/**
 * Core type definitions for envcast schema validation
 */

export type EnvVarType = 'string' | 'number' | 'boolean' | 'url' | 'email' | 'port';

export interface EnvVarSchema {
  /** The expected type of the environment variable */
  type: EnvVarType;
  /** Whether the variable is required (default: true) */
  required?: boolean;
  /** Default value if the variable is not set */
  default?: string;
  /** Human-readable description for documentation */
  description?: string;
  /** Allowed values (enum-like constraint) */
  allowedValues?: string[];
  /** Minimum value for number/port types */
  min?: number;
  /** Maximum value for number/port types */
  max?: number;
  /** Regex pattern for string validation */
  pattern?: string;
}

export interface EnvSchema {
  [variableName: string]: EnvVarSchema;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  variable: string;
  message: string;
  /** The type that was expected for this variable */
  expectedType?: EnvVarType;
  file?: string;
}

export interface ValidationWarning {
  variable: string;
  message: string;
  file?: string;
}

/**
 * A parsed and validated environment variable value, typed according to its schema.
 * - `string` and `url` and `email` types resolve to `string`
 * - `number` and `port` types resolve to `number`
 * - `boolean` type resolves to `boolean`
 */
export type ParsedEnvValue<T extends EnvVarType> =
  T extends 'number' | 'port' ? number :
  T extends 'boolean' ? boolean :
  string;
