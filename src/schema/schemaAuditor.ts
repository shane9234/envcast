import { EnvSchema, SchemaField } from "./types";

export type AuditSeverity = "error" | "warning" | "info";

export interface AuditIssue {
  field: string;
  severity: AuditSeverity;
  code: string;
  message: string;
}

export interface AuditResult {
  issues: AuditIssue[];
  score: number; // 0–100
  passed: boolean;
}

export function auditSchema(schema: EnvSchema): AuditResult {
  const issues: AuditIssue[] = [];

  for (const [field, def] of Object.entries(schema)) {
    issues.push(...auditField(field, def));
  }

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;
  const total = Object.keys(schema).length;

  const penalty = errorCount * 20 + warningCount * 5;
  const score = Math.max(0, 100 - (total === 0 ? 0 : penalty));

  return {
    issues,
    score,
    passed: errorCount === 0,
  };
}

export function auditField(field: string, def: SchemaField): AuditIssue[] {
  const issues: AuditIssue[] = [];

  if (!def.description || def.description.trim() === "") {
    issues.push({
      field,
      severity: "warning",
      code: "MISSING_DESCRIPTION",
      message: `Field "${field}" has no description.`,
    });
  }

  if (def.required === undefined) {
    issues.push({
      field,
      severity: "info",
      code: "IMPLICIT_REQUIRED",
      message: `Field "${field}" does not explicitly declare 'required'.`,
    });
  }

  if (!def.type) {
    issues.push({
      field,
      severity: "error",
      code: "MISSING_TYPE",
      message: `Field "${field}" is missing a type declaration.`,
    });
  }

  if (def.secret === true && def.defaultValue !== undefined) {
    issues.push({
      field,
      severity: "warning",
      code: "SECRET_WITH_DEFAULT",
      message: `Field "${field}" is marked secret but has a default value.`,
    });
  }

  return issues;
}
