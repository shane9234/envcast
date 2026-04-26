import { loadSchema } from "../schema/schemaLoader";
import { exportSchema, SchemaExportFormat } from "../schema/schemaExporter";
import { CliOptions } from "./cliOptions";

const SUPPORTED_FORMATS: SchemaExportFormat[] = ["json", "markdown", "dotenv"];

export function handleSchemaExport(options: CliOptions): void {
  const schemaPath = options.schema;
  if (!schemaPath) {
    console.error("Error: --schema <path> is required for schema export.");
    process.exit(1);
  }

  const format = resolveFormat(options.format);
  let schema;
  try {
    schema = loadSchema(schemaPath);
  } catch (err: any) {
    console.error(`Error loading schema: ${err.message}`);
    process.exit(1);
  }

  let content: string;
  try {
    content = exportSchema(schema, format, options.output);
  } catch (err: any) {
    console.error(`Error exporting schema: ${err.message}`);
    process.exit(1);
  }

  if (options.output) {
    console.log(`Schema exported to: ${options.output}`);
  } else {
    console.log(content);
  }
}

function resolveFormat(raw?: string): SchemaExportFormat {
  if (!raw) return "json";
  if (SUPPORTED_FORMATS.includes(raw as SchemaExportFormat)) {
    return raw as SchemaExportFormat;
  }
  console.error(
    `Error: Unsupported format "${raw}". Supported: ${SUPPORTED_FORMATS.join(", ")}`
  );
  process.exit(1);
}
