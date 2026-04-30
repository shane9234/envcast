import { loadSchema } from "../schema/schemaLoader";
import {
  filterSchema,
  formatFilterResult,
  FilterOptions,
} from "../schema/schemaFilter";
import { ParsedArgs } from "./cliOptions";

export function resolveFilterOptions(args: ParsedArgs): FilterOptions {
  const options: FilterOptions = {};

  if (args.required !== undefined) {
    options.required = args.required === "true" || args.required === true;
  }
  if (args.secret !== undefined) {
    options.secret = args.secret === "true" || args.secret === true;
  }
  if (args["has-default"] !== undefined) {
    options.hasDefault =
      args["has-default"] === "true" || args["has-default"] === true;
  }
  if (args["has-description"] !== undefined) {
    options.hasDescription =
      args["has-description"] === "true" || args["has-description"] === true;
  }
  if (args.types) {
    options.types = String(args.types).split(",").map((t) => t.trim());
  }
  if (args.tags) {
    options.tags = String(args.tags).split(",").map((t) => t.trim());
  }
  if (args.pattern) {
    options.pattern = String(args.pattern);
  }

  return options;
}

export async function handleFilterSchema(
  args: ParsedArgs
): Promise<void> {
  const schemaPath = args.schema ? String(args.schema) : "envcast.schema.json";

  let schema;
  try {
    schema = await loadSchema(schemaPath);
  } catch (err: any) {
    console.error(`Failed to load schema: ${err.message}`);
    process.exit(1);
  }

  const options = resolveFilterOptions(args);
  const result = filterSchema(schema, options);

  if (result.matchCount === 0) {
    console.log("No fields matched the given filters.");
    return;
  }

  console.log(formatFilterResult(result));
}
