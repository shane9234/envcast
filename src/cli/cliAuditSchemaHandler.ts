import path from "path";
import { loadSchema } from "../schema/schemaLoader";
import { auditSchema, AuditIssue } from "../schema/schemaAuditor";

const SEVERITY_ICON: Record<string, string> = {
  error: "✖",
  warning: "⚠",
  info: "ℹ",
};

export function formatAuditIssue(issue: AuditIssue): string {
  const icon = SEVERITY_ICON[issue.severity] ?? "•";
  return `  ${icon} [${issue.severity.toUpperCase()}] ${issue.field}: ${issue.message} (${issue.code})`;
}

export async function handleAuditSchema(
  schemaPath: string,
  options: { json?: boolean } = {}
): Promise<void> {
  const resolved = path.resolve(schemaPath);
  let schema;

  try {
    schema = await loadSchema(resolved);
  } catch (err: any) {
    console.error(`Failed to load schema: ${err.message}`);
    process.exit(1);
  }

  const result = auditSchema(schema);

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.passed ? 0 : 1);
  }

  console.log(`\nSchema Audit: ${resolved}`);
  console.log(`Score: ${result.score}/100 | Status: ${result.passed ? "✔ PASSED" : "✖ FAILED"}\n`);

  if (result.issues.length === 0) {
    console.log("  No issues found.");
  } else {
    const grouped: Record<string, AuditIssue[]> = {};
    for (const issue of result.issues) {
      (grouped[issue.field] ??= []).push(issue);
    }
    for (const [field, issues] of Object.entries(grouped)) {
      console.log(`  ${field}`);
      for (const issue of issues) {
        console.log(formatAuditIssue(issue));
      }
    }
  }

  console.log("");
  process.exit(result.passed ? 0 : 1);
}
