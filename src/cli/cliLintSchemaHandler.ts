import { loadSchema } from '../schema/schemaLoader';
import { lintSchema, LintIssue } from '../schema/schemaLinter';

function formatIssue(issue: LintIssue): string {
  const icon = issue.severity === 'error' ? '✖' : '⚠';
  return `  ${icon} [${issue.severity.toUpperCase()}] ${issue.field}: ${issue.message}`;
}

export async function handleLintSchema(
  schemaPath: string,
  options: { json?: boolean } = {}
): Promise<void> {
  let schema;
  try {
    schema = await loadSchema(schemaPath);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Failed to load schema: ${message}`);
    process.exit(1);
  }

  const result = lintSchema(schema);

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    if (!result.valid) process.exit(1);
    return;
  }

  if (result.issues.length === 0) {
    console.log('✔ Schema lint passed with no issues.');
    return;
  }

  const errors = result.issues.filter((i) => i.severity === 'error');
  const warnings = result.issues.filter((i) => i.severity === 'warning');

  if (warnings.length > 0) {
    console.log(`\nWarnings (${warnings.length}):`);
    warnings.forEach((i) => console.log(formatIssue(i)));
  }

  if (errors.length > 0) {
    console.log(`\nErrors (${errors.length}):`);
    errors.forEach((i) => console.log(formatIssue(i)));
  }

  console.log(
    `\nLint result: ${result.valid ? '✔ PASSED' : '✖ FAILED'} — ${errors.length} error(s), ${warnings.length} warning(s).`
  );

  if (!result.valid) process.exit(1);
}
