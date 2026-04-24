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
  file?: string;
}

export interface ValidationWarning {
  variable: string;
  message: string;
  file?: string;
}
