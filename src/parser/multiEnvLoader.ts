import * as path from 'path';
import { parseEnvFile, EnvEntry, ParseError } from './envParser';

export interface LoadResult {
  entries: Map<string, EnvEntry[]>;
  errors: ParseError[];
  filesLoaded: string[];
  filesFailed: string[];
}

export interface LoadOptions {
  /** Continue loading even if a file has parse errors */
  continueOnError?: boolean;
}

export function loadEnvFiles(
  filePaths: string[],
  options: LoadOptions = {}
): LoadResult {
  const { continueOnError = true } = options;
  const entries = new Map<string, EnvEntry[]>();
  const allErrors: ParseError[] = [];
  const filesLoaded: string[] = [];
  const filesFailed: string[] = [];

  for (const filePath of filePaths) {
    try {
      const result = parseEnvFile(filePath);

      if (result.errors.length > 0 && !continueOnError) {
        filesFailed.push(filePath);
        allErrors.push(...result.errors);
        continue;
      }

      allErrors.push(...result.errors);
      filesLoaded.push(filePath);

      for (const entry of result.entries) {
        const existing = entries.get(entry.key) ?? [];
        entries.set(entry.key, [...existing, entry]);
      }
    } catch (err) {
      filesFailed.push(filePath);
      allErrors.push({
        line: '',
        lineNumber: 0,
        filePath,
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { entries, errors: allErrors, filesLoaded, filesFailed };
}

export function getConflicts(entries: Map<string, EnvEntry[]>): Map<string, EnvEntry[]> {
  const conflicts = new Map<string, EnvEntry[]>();
  for (const [key, envEntries] of entries.entries()) {
    if (envEntries.length > 1) {
      conflicts.set(key, envEntries);
    }
  }
  return conflicts;
}
