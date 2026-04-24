import * as fs from 'fs';
import * as path from 'path';

export interface EnvEntry {
  key: string;
  value: string;
  lineNumber: number;
  filePath: string;
}

export interface ParseResult {
  entries: EnvEntry[];
  errors: ParseError[];
}

export interface ParseError {
  line: string;
  lineNumber: number;
  filePath: string;
  reason: string;
}

const COMMENT_REGEX = /^\s*#/;
const BLANK_LINE_REGEX = /^\s*$/;
const KEY_VALUE_REGEX = /^\s*([\w.\-]+)\s*=\s*(.*)?\s*$/;

export function parseEnvFile(filePath: string): ParseResult {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  const content = fs.readFileSync(absolutePath, 'utf-8');
  return parseEnvContent(content, filePath);
}

export function parseEnvContent(content: string, filePath: string = '<inline>'): ParseResult {
  const lines = content.split('\n');
  const entries: EnvEntry[] = [];
  const errors: ParseError[] = [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    if (COMMENT_REGEX.test(line) || BLANK_LINE_REGEX.test(line)) {
      return;
    }

    const match = KEY_VALUE_REGEX.exec(line);
    if (!match) {
      errors.push({ line, lineNumber, filePath, reason: 'Invalid key=value format' });
      return;
    }

    const key = match[1];
    let value = match[2] ?? '';

    // Strip inline comments
    value = value.replace(/\s+#.*$/, '');

    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    entries.push({ key, value, lineNumber, filePath });
  });

  return { entries, errors };
}
