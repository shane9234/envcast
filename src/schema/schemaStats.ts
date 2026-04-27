import { EnvSchema, FieldSchema } from './types';

export interface SchemaStats {
  totalFields: number;
  requiredFields: number;
  optionalFields: number;
  secretFields: number;
  fieldsByType: Record<string, number>;
  withDefault: number;
  withDescription: number;
  withPattern: number;
  coverageScore: number; // 0-100
}

export function computeSchemaStats(schema: EnvSchema): SchemaStats {
  const fields = Object.values(schema);
  const totalFields = fields.length;

  if (totalFields === 0) {
    return {
      totalFields: 0,
      requiredFields: 0,
      optionalFields: 0,
      secretFields: 0,
      fieldsByType: {},
      withDefault: 0,
      withDescription: 0,
      withPattern: 0,
      coverageScore: 0,
    };
  }

  const requiredFields = fields.filter((f) => f.required === true).length;
  const optionalFields = totalFields - requiredFields;
  const secretFields = fields.filter((f) => f.secret === true).length;
  const withDefault = fields.filter((f) => f.default !== undefined).length;
  const withDescription = fields.filter(
    (f) => typeof f.description === 'string' && f.description.trim().length > 0
  ).length;
  const withPattern = fields.filter((f) => f.pattern !== undefined).length;

  const fieldsByType: Record<string, number> = {};
  for (const field of fields) {
    const type = field.type ?? 'string';
    fieldsByType[type] = (fieldsByType[type] ?? 0) + 1;
  }

  const coverageScore = computeCoverageScore(fields, totalFields);

  return {
    totalFields,
    requiredFields,
    optionalFields,
    secretFields,
    fieldsByType,
    withDefault,
    withDescription,
    withPattern,
    coverageScore,
  };
}

function computeCoverageScore(fields: FieldSchema[], total: number): number {
  if (total === 0) return 0;
  let score = 0;
  for (const field of fields) {
    let fieldScore = 0;
    if (typeof field.description === 'string' && field.description.trim().length > 0) fieldScore += 40;
    if (field.type !== undefined) fieldScore += 30;
    if (field.default !== undefined || field.required === true) fieldScore += 20;
    if (field.pattern !== undefined) fieldScore += 10;
    score += fieldScore;
  }
  return Math.round(score / total);
}

export function formatStats(stats: SchemaStats): string {
  const lines: string[] = [
    `Schema Statistics`,
    `=================`,
    `Total fields    : ${stats.totalFields}`,
    `Required        : ${stats.requiredFields}`,
    `Optional        : ${stats.optionalFields}`,
    `Secrets         : ${stats.secretFields}`,
    `With default    : ${stats.withDefault}`,
    `With description: ${stats.withDescription}`,
    `With pattern    : ${stats.withPattern}`,
    `Coverage score  : ${stats.coverageScore}/100`,
    ``,
    `Fields by type:`,
  ];
  for (const [type, count] of Object.entries(stats.fieldsByType)) {
    lines.push(`  ${type}: ${count}`);
  }
  return lines.join('\n');
}
