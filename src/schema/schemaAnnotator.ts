import { EnvSchema, EnvFieldSchema } from './types';

export interface AnnotatedField extends EnvFieldSchema {
  key: string;
  annotations: string[];
}

export interface AnnotatedSchema {
  fields: AnnotatedField[];
  totalAnnotations: number;
}

export function annotateSchema(schema: EnvSchema, envValues?: Record<string, string>): AnnotatedSchema {
  const fields: AnnotatedField[] = Object.entries(schema).map(([key, field]) => {
    const annotations = buildAnnotations(key, field, envValues);
    return { key, ...field, annotations };
  });

  const totalAnnotations = fields.reduce((sum, f) => sum + f.annotations.length, 0);
  return { fields, totalAnnotations };
}

export function buildAnnotations(
  key: string,
  field: EnvFieldSchema,
  envValues?: Record<string, string>
): string[] {
  const annotations: string[] = [];

  if (field.required) {
    annotations.push('@required');
  }

  if (field.secret) {
    annotations.push('@secret');
  }

  if (field.default !== undefined) {
    annotations.push(`@default(${field.default})`);
  }

  if (field.type) {
    annotations.push(`@type(${field.type})`);
  }

  if (envValues) {
    const value = envValues[key];
    if (value === undefined && field.required) {
      annotations.push('@missing');
    } else if (value !== undefined) {
      annotations.push('@present');
    }
  }

  return annotations;
}

export function formatAnnotatedSchema(annotated: AnnotatedSchema): string {
  const lines: string[] = [];

  for (const field of annotated.fields) {
    lines.push(`${field.key}:`);
    if (field.description) {
      lines.push(`  # ${field.description}`);
    }
    for (const annotation of field.annotations) {
      lines.push(`  ${annotation}`);
    }
  }

  return lines.join('\n');
}
