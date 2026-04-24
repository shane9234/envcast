import { CliOptions } from './cliOptions';
import { loadEnvFiles } from '../parser/multiEnvLoader';
import { loadSchema } from '../schema/schemaLoader';
import { buildMultiEnvReport, buildEnvReport } from '../reporter/reportGenerator';
import { exportReport, resolveOutputPath, ExportFormat } from '../reporter/reportExporter';

export function handleExport(options: CliOptions): void {
  const { files, schema: schemaPath, format, output, overwrite } = options;

  if (!output) {
    throw new Error('--output path is required for export.');
  }

  const exportFormat = (format ?? 'text') as ExportFormat;
  const resolvedOutput = resolveOutputPath(output, exportFormat);

  const schema = schemaPath ? loadSchema(schemaPath) : undefined;

  let report;
  if (files.length === 1) {
    const envMap = loadEnvFiles(files);
    const envRecord = envMap[files[0]] ?? {};
    report = buildEnvReport(files[0], envRecord, schema);
  } else {
    const envMap = loadEnvFiles(files);
    report = buildMultiEnvReport(envMap, schema);
  }

  exportReport(report, {
    format: exportFormat,
    outputPath: resolvedOutput,
    overwrite: overwrite ?? false,
  });

  console.log(`Report exported to: ${resolvedOutput}`);
}
