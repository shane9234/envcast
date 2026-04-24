import { MultiEnvReport, EnvReport, ReportFormat } from './reportTypes';

export function formatReport(report: MultiEnvReport, format: ReportFormat): string {
  switch (format) {
    case 'json':
      return JSON.stringify(report, null, 2);
    case 'markdown':
      return formatMarkdown(report);
    default:
      return formatText(report);
  }
}

function formatText(report: MultiEnvReport): string {
  const lines: string[] = [];
  lines.push(`Overall Status: ${report.overallStatus.toUpperCase()}\n`);

  for (const envReport of report.reports) {
    lines.push(`File: ${envReport.file}`);
    lines.push(`  Total: ${envReport.summary.total} | Valid: ${envReport.summary.valid} | Missing: ${envReport.summary.missing} | Invalid: ${envReport.summary.invalid} | Extra: ${envReport.summary.extra}`);
    for (const v of envReport.variables) {
      const icon = v.status === 'valid' ? '✓' : v.status === 'extra' ? '~' : '✗';
      const detail = v.message ? ` — ${v.message}` : v.value ? ` = ${v.value}` : '';
      lines.push(`  ${icon} ${v.key} [${v.status}]${detail}`);
    }
    lines.push('');
  }

  if (Object.keys(report.conflicts).length > 0) {
    lines.push('Conflicts:');
    for (const [key, files] of Object.entries(report.conflicts)) {
      lines.push(`  ${key}: ${files.join(', ')}`);
    }
  }

  return lines.join('\n');
}

function formatMarkdown(report: MultiEnvReport): string {
  const lines: string[] = [];
  lines.push(`# Env Validation Report\n`);
  lines.push(`**Status:** ${report.overallStatus.toUpperCase()}\n`);

  for (const envReport of report.reports) {
    lines.push(`## ${envReport.file}\n`);
    lines.push('| Variable | Status | Value | Type | Message |');
    lines.push('|----------|--------|-------|------|---------|');
    for (const v of envReport.variables) {
      lines.push(`| ${v.key} | ${v.status} | ${v.value ?? ''} | ${v.expectedType ?? ''} | ${v.message ?? ''} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
