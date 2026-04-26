import * as fs from "fs";
import * as path from "path";
import { loadSchema } from "../schema/schemaLoader";
import { compareSchemas, formatCompareResult } from "../schema/schemaComparator";
import { CliOptions } from "./cliOptions";

/**
 * Handles the `compare` CLI command.
 * Loads two schema files and prints a human-readable diff of their fields.
 */
export async function handleCompare(
  options: CliOptions,
  argv: string[]
): Promise<void> {
  // Expect two positional arguments after the command: <schemaA> <schemaB>
  const [schemaPathA, schemaPathB] = argv;

  if (!schemaPathA || !schemaPathB) {
    console.error(
      "Usage: envcast compare <schemaA> <schemaB>"
    );
    process.exit(1);
  }

  const resolvedA = path.resolve(process.cwd(), schemaPathA);
  const resolvedB = path.resolve(process.cwd(), schemaPathB);

  if (!fs.existsSync(resolvedA)) {
    console.error(`Schema file not found: ${resolvedA}`);
    process.exit(1);
  }

  if (!fs.existsSync(resolvedB)) {
    console.error(`Schema file not found: ${resolvedB}`);
    process.exit(1);
  }

  let schemaA: ReturnType<typeof loadSchema>;
  let schemaB: ReturnType<typeof loadSchema>;

  try {
    schemaA = loadSchema(resolvedA);
  } catch (err) {
    console.error(`Failed to load schema A (${schemaPathA}): ${(err as Error).message}`);
    process.exit(1);
  }

  try {
    schemaB = loadSchema(resolvedB);
  } catch (err) {
    console.error(`Failed to load schema B (${schemaPathB}): ${(err as Error).message}`);
    process.exit(1);
  }

  const result = compareSchemas(schemaA, schemaB);
  const output = formatCompareResult(result, schemaPathA, schemaPathB);

  console.log(output);

  // Exit with code 1 if there are any differences, useful for CI pipelines
  const hasDiff =
    result.added.length > 0 ||
    result.removed.length > 0 ||
    result.changed.length > 0;

  if (hasDiff && options.strict) {
    process.exit(1);
  }
}
