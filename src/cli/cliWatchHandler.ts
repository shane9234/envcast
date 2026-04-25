import * as path from 'path';
import { watchSchema, WatchEvent } from '../schema/schemaWatcher';
import { loadEnvFiles } from '../parser/multiEnvLoader';
import { validateEnv } from '../schema/schemaValidator';
import { buildMultiEnvReport } from '../reporter/reportGenerator';
import { formatReport } from '../reporter/reportFormatter';
import { CliOptions } from './cliOptions';

function printWatchEvent(event: WatchEvent, options: CliOptions): void {
  const timestamp = new Date().toISOString();

  if (event.type === 'error') {
    console.error(`[${timestamp}] Schema error: ${event.error?.message}`);
    return;
  }

  if (event.type === 'removed') {
    console.warn(`[${timestamp}] Schema file removed: ${event.schemaPath}`);
    return;
  }

  console.log(`[${timestamp}] Schema changed — re-validating...`);

  try {
    const envFiles = options.envFiles ?? ['.env'];
    const { entries } = loadEnvFiles(envFiles);
    const schema = event.current!;
    const validationResult = validateEnv(entries, schema);
    const report = buildMultiEnvReport(entries, schema, validationResult, envFiles);
    const output = formatReport(report, options.format ?? 'text');
    console.log(output);
  } catch (err) {
    console.error(`[${timestamp}] Validation failed: ${(err as Error).message}`);
  }
}

export function handleWatch(options: CliOptions): void {
  const schemaPath = path.resolve(options.schema ?? 'schema.json');
  console.log(`Watching schema: ${schemaPath}`);

  const watcher = watchSchema(schemaPath, (event) => {
    printWatchEvent(event, options);
  });

  process.on('SIGINT', () => {
    console.log('\nStopping watcher...');
    watcher.stop();
    process.exit(0);
  });
}
