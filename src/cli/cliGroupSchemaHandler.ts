import * as fs from 'fs';
import * as path from 'path';
import { loadSchema } from '../schema/schemaLoader';
import { groupSchema, formatGroupedSchema } from '../schema/schemaGrouper';
import { CliOptions } from './cliOptions';

export type GroupMode = 'prefix' | 'tag' | 'required';

export function resolveGroupMode(raw: string | undefined): GroupMode {
  if (raw === 'tag' || raw === 'required') return raw;
  return 'prefix';
}

export async function handleGroupSchema(options: CliOptions): Promise<void> {
  const schemaPath = options.schema;
  if (!schemaPath) {
    console.error('Error: --schema path is required for group command.');
    process.exit(1);
  }

  const schema = loadSchema(schemaPath);
  if (!schema) {
    console.error(`Error: Could not load schema from ${schemaPath}`);
    process.exit(1);
  }

  const mode = resolveGroupMode(options.groupBy);
  const grouped = groupSchema(schema, mode);
  const output = formatGroupedSchema(grouped);

  if (options.output) {
    const outPath = path.resolve(options.output);
    fs.writeFileSync(outPath, output, 'utf-8');
    console.log(`Grouped schema written to ${outPath}`);
  } else {
    console.log(output);
  }
}
