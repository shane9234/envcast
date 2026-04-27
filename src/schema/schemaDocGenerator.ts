import { EnvSchema, EnvFieldSchema } from "./types";

export interface DocSection {
  field: string;
  type: string;
  required: boolean;
  description?: string;
  defaultValue?: string;
  example?: string;
  secret: boolean;
}

export interface GeneratedDoc {
  title: string;
  sections: DocSection[];
  generatedAt: string;
}

export function generateSchemaDoc(schema: EnvSchema, title = "Environment Variables"): GeneratedDoc {
  const sections: DocSection[] = Object.entries(schema).map(([field, def]) =>
    buildDocSection(field, def)
  );

  return {
    title,
    sections,
    generatedAt: new Date().toISOString(),
  };
}

export function buildDocSection(field: string, def: EnvFieldSchema): DocSection {
  return {
    field,
    type: def.type,
    required: def.required ?? false,
    description: def.description,
    defaultValue: def.default !== undefined ? String(def.default) : undefined,
    example: def.example !== undefined ? String(def.example) : undefined,
    secret: def.secret ?? false,
  };
}

export function docToMarkdown(doc: GeneratedDoc): string {
  const lines: string[] = [
    `# ${doc.title}`,
    ``,
    `> Generated at: ${doc.generatedAt}`,
    ``,
    `| Variable | Type | Required | Default | Secret | Description |`,
    `|----------|------|----------|---------|--------|-------------|`,
  ];

  for (const s of doc.sections) {
    const required = s.required ? "✅" : "❌";
    const secret = s.secret ? "🔒" : "";
    const def = s.defaultValue ?? "—";
    const desc = s.description ?? "";
    lines.push(`| \`${s.field}\` | ${s.type} | ${required} | ${def} | ${secret} | ${desc} |`);
  }

  if (doc.sections.some((s) => s.example)) {
    lines.push(``, `## Examples`, ``);
    for (const s of doc.sections) {
      if (s.example) {
        lines.push(`- \`${s.field}\` = \`${s.example}\``);
      }
    }
  }

  return lines.join("\n");
}

export function docToText(doc: GeneratedDoc): string {
  const lines: string[] = [`${doc.title}`, `Generated at: ${doc.generatedAt}`, ``];

  for (const s of doc.sections) {
    lines.push(`${s.field}`);
    lines.push(`  Type     : ${s.type}`);
    lines.push(`  Required : ${s.required}`);
    if (s.defaultValue !== undefined) lines.push(`  Default  : ${s.defaultValue}`);
    if (s.example !== undefined) lines.push(`  Example  : ${s.example}`);
    if (s.description) lines.push(`  Desc     : ${s.description}`);
    if (s.secret) lines.push(`  Secret   : true`);
    lines.push(``);
  }

  return lines.join("\n");
}
