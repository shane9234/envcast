import { EnvSchema, EnvFieldSchema } from './types';

export interface LintIssue {
  field: string;
  severity: 'error' | 'warning';
  message: string;
}

export interface LintResult {
  issues: LintIssue[];
  valid: boolean;
}

export function lintSchema(schema: EnvSchema): LintResult {
  const issues: LintIssue[] = [];

  for (const [field, fieldSchema] of Object.entries(schema)) {
    issues.push(...lintField(field, fieldSchema));
  }

  return {
    issues,
    valid: issues.filter((i) => i.severity === 'error').length === 0,
  };
}

export function lintField(field: string, fieldSchema: EnvFieldSchema): LintIssue[] {
  const issues: LintIssue[] = [];

  if (!fieldSchema.description || fieldSchema.description.trim() === '') {
    issues.push({
      field,
      severity: 'warning',
      message: `Field "${field}" is missing a description.`,
    });
  }

  if (fieldSchema.required === undefined) {
    issues.push({
      field,
      severity: 'warning',
      message: `Field "${field}" does not explicitly declare "required".`,
    });
  }

  if (fieldSchema.type === 'enum') {
    if (!fieldSchema.values || fieldSchema.values.length === 0) {
      issues.push({
        field,
        severity: 'error',
        message: `Field "${field}" is type "enum" but has no "values" defined.`,
      });
    }
  }

  if (
    fieldSchema.default !== undefined &&
    fieldSchema.required === true
  ) {
    issues.push({
      field,
      severity: 'warning',
      message: `Field "${field}" is marked required but also has a default value.`,
    });
  }

  if (!/^[A-Z][A-Z0-9_]*$/.test(field)) {
    issues.push({
      field,
      severity: 'warning',
      message: `Field "${field}" does not follow SCREAMING_SNAKE_CASE convention.`,
    });
  }

  return issues;
}
