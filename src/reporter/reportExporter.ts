import * as fs from 'fs';
import * as path from 'path';
import { EnvReport, MultiEnvReport } from './reportTypes';
import { formatReport } from './reportFormatter';

export type ExportFormat = 'text' | 'markdown' | 'json';

export interface ExportOptions {
  format: ExportFormat;
  outputPath: string;
  overwrite?: boolean;
}

export function exportReport(
  report: EnvReport | MultiEnvReport,
  options: ExportOptions
): void {
  const { format, outputPath, overwrite = false } = options;

  if (!overwrite && fs.existsSync(outputPath)) {
    throw new Error(`Output file already exists: ${outputPath}. Use --overwrite to replace it.`);
  }

  const dir = path.dirname(outputPath);
  if (dir && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const content = serializeReport(report, format);
  fs.writeFileSync(outputPath, content, 'utf-8');
}

export function serializeReport(
  report: EnvReport | MultiEnvReport,
  format: ExportFormat
): string {
  if (format === 'json') {
    return JSON.stringify(report, null, 2);
  }
  return formatReport(report, format);
}

export function resolveOutputPath(base: string, format: ExportFormat): string {
  const extensions: Record<ExportFormat, string> = {
    text: '.txt',
    markdown: '.md',
    json: '.json',
  };
  const ext = extensions[format];
  if (base.endsWith(ext)) return base;
  return `${base}${ext}`;
}
