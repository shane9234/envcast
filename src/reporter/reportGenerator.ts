import { EnvSchema } from '../schema/types';
import { ValidationResult } from '../schema/schemaValidator';
import { EnvReport, MultiEnvReport, VariableReport, ValidationStatus } from './reportTypes';

export function buildEnvReport(
  file: string,
  env: Record<string, string>,
  schema: EnvSchema,
  result: ValidationResult
): EnvReport {
  const variables: VariableReport[] = [];

  for (const [key, rule] of Object.entries(schema)) {
    const value = env[key];
    const error = result.errors.find((e) => e.key === key);

    let status: ValidationStatus = 'valid';
    let message: string | undefined;

    if (error) {
      status = value === undefined ? 'missing' : 'invalid';
      message = error.message;
    }

    variables.push({
      key,
      status,
      value: value !== undefined ? maskSecret(key, value) : undefined,
      expectedType: rule.type,
      message,
      source: file,
    });
  }

  for (const key of Object.keys(env)) {
    if (!schema[key]) {
      variables.push({ key, status: 'extra', value: maskSecret(key, env[key]), source: file });
    }
  }

  const summary = {
    total: variables.length,
    valid: variables.filter((v) => v.status === 'valid').length,
    missing: variables.filter((v) => v.status === 'missing').length,
    invalid: variables.filter((v) => v.status === 'invalid').length,
    extra: variables.filter((v) => v.status === 'extra').length,
  };

  return { file, variables, summary };
}

export function buildMultiEnvReport(
  reports: EnvReport[],
  conflicts: Record<string, string[]>
): MultiEnvReport {
  const overallStatus = reports.every(
    (r) => r.summary.missing === 0 && r.summary.invalid === 0
  )
    ? 'pass'
    : 'fail';

  return { reports, conflicts, overallStatus };
}

function maskSecret(key: string, value: string): string {
  const secretPattern = /secret|password|token|key|auth/i;
  if (secretPattern.test(key)) {
    return value.length > 4 ? `${value.slice(0, 2)}***${value.slice(-2)}` : '***';
  }
  return value;
}
