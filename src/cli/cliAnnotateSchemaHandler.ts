import fs from 'fs';
import path from 'path';
import { loadSchema } from '../schema/schemaLoader';
import { annotateSchema, formatAnnotatedSchema } from '../schema/schemaAnnotator';
import { parseEnvFile } from '../parser/envParser';
import { CliOptions } from './cliOptions';

export async function handleAnnotateSchema(options: CliOptions): Promise<void> {
  const schemaPath = options.schema;
  if (!schemaPath) {
    console.error('Error: --schema <path> is required for annotate-schema command.');
    process.exit(1);
  }

  const schema = loadSchema(schemaPath);

  let envValues: Record<string, string> | undefined;
  if (options.env) {
    const envPaths = Array.isArray(options.env) ? options.env : [options.env];
    envValues = {};
    for (const envPath of envPaths) {
      const content = fs.readFileSync(path.resolve(envPath), 'utf-8');
      const parsed = parseEnvFile(content);
      Object.assign(envValues, parsed);
    }
  }

  const annotated = annotateSchema(schema, envValues);

  const format = resolveAnnotateFormat(options.format);

  if (format === 'json') {
    console.log(JSON.stringify(annotated, null, 2));
  } else {
    const output = formatAnnotatedSchema(annotated);
    console.log(output);
    console.log(`\nTotal annotations: ${annotated.totalAnnotations}`);
  }
}

export function resolveAnnotateFormat(format?: string): 'text' | 'json' {
  if (format === 'json') return 'json';
  return 'text';
}
