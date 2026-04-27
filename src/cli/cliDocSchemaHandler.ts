import * as fs from "fs";
import * as path from "path";
import { loadSchema } from "../schema/schemaLoader";
import { generateSchemaDoc, docToMarkdown, docToText } from "../schema/schemaDocGenerator";

export type DocFormat = "markdown" | "text";

export function resolveDocFormat(raw: string | undefined): DocFormat {
  if (raw === "text") return "text";
  return "markdown";
}

export async function handleSchemaDoc(args: {
  schema: string;
  output?: string;
  format?: string;
  title?: string;
}): Promise<void> {
  const schemaPath = path.resolve(args.schema);

  if (!fs.existsSync(schemaPath)) {
    console.error(`Schema file not found: ${schemaPath}`);
    process.exit(1);
  }

  let schema;
  try {
    schema = await loadSchema(schemaPath);
  } catch (err) {
    console.error(`Failed to load schema: ${(err as Error).message}`);
    process.exit(1);
  }

  const format = resolveDocFormat(args.format);
  const title = args.title ?? "Environment Variables";
  const doc = generateSchemaDoc(schema, title);

  const content = format === "text" ? docToText(doc) : docToMarkdown(doc);

  if (args.output) {
    const outPath = path.resolve(args.output);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, content, "utf-8");
    console.log(`Documentation written to ${outPath}`);
  } else {
    console.log(content);
  }
}
