import { EnvSchema, EnvFieldSchema } from './types';

export interface TemplateOptions {
  includeComments?: boolean;
  includeDefaults?: boolean;
  placeholderStyle?: 'empty' | 'type' | 'example';
}

const DEFAULT_OPTIONS: TemplateOptions = {
  includeComments: true,
  includeDefaults: true,
  placeholderStyle: 'type',
};

export function generateTemplate(schema: EnvSchema, options: TemplateOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const lines: string[] = [];

  for (const [key, field] of Object.entries(schema)) {
    if (opts.includeComments) {
      const commentParts: string[] = [];
      if (field.description) commentParts.push(field.description);
      if (field.required) commentParts.push('required');
      if (field.type) commentParts.push(`type: ${field.type}`);
      if (commentParts.length > 0) {
        lines.push(`# ${commentParts.join(' | ')}`);
      }
    }

    const value = resolveTemplateValue(field, opts);
    lines.push(`${key}=${value}`);
    lines.push('');
  }

  return lines.join('\n').trimEnd() + '\n';
}

function resolveTemplateValue(field: EnvFieldSchema, opts: TemplateOptions): string {
  if (opts.includeDefaults && field.default !== undefined) {
    return String(field.default);
  }

  switch (opts.placeholderStyle) {
    case 'empty':
      return '';
    case 'example':
      return getExampleValue(field);
    case 'type':
    default:
      return getTypePlaceholder(field);
  }
}

function getTypePlaceholder(field: EnvFieldSchema): string {
  switch (field.type) {
    case 'number': return '<number>';
    case 'boolean': return '<true|false>';
    case 'string':
    default:
      return '<string>';
  }
}

function getExampleValue(field: EnvFieldSchema): string {
  switch (field.type) {
    case 'number': return '42';
    case 'boolean': return 'true';
    case 'string':
    default:
      return 'example_value';
  }
}
