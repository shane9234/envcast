import path from "path";
import { loadSchema } from "../schema/schemaLoader";
import { mergeSchemas, MergeStrategy } from "../schema/schemaMerger";
import { exportSchema } from "../schema/schemaExporter";
import { CliOptions } from "./cliOptions";

export async function handleSchemaMerge(
  options: CliOptions & { mergeTarget?: string; mergeStrategy?: string }
): Promise<void> {
  const baseSchemaPath = options.schema;
  const overridePath = options.mergeTarget;

  if (!baseSchemaPath || !overridePath) {
    console.error("Error: --schema and --merge-target are required for merge.");
    process.exit(1);
  }

  const strategy = resolveStrategy(options.mergeStrategy);

  let baseSchema;
  let overrideSchema;

  try {
    baseSchema = await loadSchema(path.resolve(baseSchemaPath));
  } catch (err) {
    console.error(`Error loading base schema: ${(err as Error).message}`);
    process.exit(1);
  }

  try {
    overrideSchema = await loadSchema(path.resolve(overridePath));
  } catch (err) {
    console.error(`Error loading override schema: ${(err as Error).message}`);
    process.exit(1);
  }

  const { schema: merged, conflicts } = mergeSchemas(baseSchema, overrideSchema, { strategy });

  if (conflicts.length > 0) {
    console.warn(`⚠ Conflicts resolved (${strategy}): ${conflicts.join(", ")}`);
  }

  const outputPath = options.output;
  const format = (options.format as "json" | "dotenv" | "markdown") ?? "json";

  if (outputPath) {
    await exportSchema(merged, { format, outputPath: path.resolve(outputPath) });
    console.log(`✔ Merged schema written to ${outputPath}`);
  } else {
    const { serializeSchema } = await import("../schema/schemaExporter");
    console.log(serializeSchema(merged, format));
  }
}

function resolveStrategy(raw?: string): MergeStrategy {
  if (raw === "prefer-base" || raw === "prefer-override" || raw === "union") {
    return raw;
  }
  return "union";
}
