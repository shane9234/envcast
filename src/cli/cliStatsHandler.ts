import * as fs from 'fs';
import * as path from 'path';
import { loadSchema } from '../schema/schemaLoader';
import { computeSchemaStats, formatStats, SchemaStats } from '../schema/schemaStats';

export interface StatsOptions {
  schemaPath: string;
  format?: 'text' | 'json';
  output?: string;
}

export async function handleStats(options: StatsOptions): Promise<void> {
  const { schemaPath, format = 'text', output } = options;

  const schema = await loadSchema(schemaPath);
  const stats = computeSchemaStats(schema);

  const serialized = serializeStats(stats, format);

  if (output) {
    const resolved = path.resolve(output);
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
    fs.writeFileSync(resolved, serialized, 'utf-8');
    console.log(`Stats written to ${resolved}`);
  } else {
    console.log(serialized);
  }
}

export function serializeStats(
  stats: SchemaStats,
  format: 'text' | 'json'
): string {
  if (format === 'json') {
    return JSON.stringify(stats, null, 2);
  }
  return formatStats(stats);
}
