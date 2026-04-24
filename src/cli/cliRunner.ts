import * as fs from 'fs';
import * as path from 'path';
import { parseArgs, CliOptions } from './cliOptions';
import { loadEnvFiles } from '../parser/multiEnvLoader';
import { buildMultiEnvReport } from '../reporter/reportGenerator';
import { formatReport } from '../reporter/reportFormatter';
import { EnvSchema } from '../schema/types';

export async function run(argv: string[]): Promise<void> {
  const options = parseArgs(argv);

  if (options.files.length === 0) {
    console.error('Error: No .env files specified.');
    process.exit(1);
  }

  let schema: EnvSchema | undefined;
  if (options.schema) {
    const schemaPath = path.resolve(options.schema);
    if (!fs.existsSync(schemaPath)) {
      console.error(`Error: Schema file not found: ${schemaPath}`);
      process.exit(1);
    }
    const raw = fs.readFileSync(schemaPath, 'utf-8');
    schema = JSON.parse(raw) as EnvSchema;
  }

  const resolvedFiles = options.files.map((f) => path.resolve(f));
  const missing = resolvedFiles.filter((f) => !fs.existsSync(f));
  if (missing.length > 0) {
    console.error(`Error: File(s) not found: ${missing.join(', ')}`);
    process.exit(1);
  }

  const envData = loadEnvFiles(resolvedFiles);
  const report = buildMultiEnvReport(envData, schema, options.maskSecrets);
  const output = formatReport(report, options.format);

  if (options.output) {
    fs.writeFileSync(path.resolve(options.output), output, 'utf-8');
    console.log(`Report written to ${options.output}`);
  } else {
    console.log(output);
  }

  const hasErrors = report.files.some((f) =>
    f.entries.some((e) => e.validationResult && !e.validationResult.valid)
  );

  if (options.strict && hasErrors) {
    process.exit(1);
  }
}
