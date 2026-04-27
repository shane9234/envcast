import * as fs from 'fs';
import * as path from 'path';
import { EnvSchema } from './types';

export interface SchemaVersion {
  version: string;
  timestamp: string;
  schema: EnvSchema;
  description?: string;
}

export interface SchemaVersionIndex {
  current: string;
  versions: string[];
}

export function saveSchemaVersion(
  schema: EnvSchema,
  version: string,
  dir: string,
  description?: string
): SchemaVersion {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const entry: SchemaVersion = {
    version,
    timestamp: new Date().toISOString(),
    schema,
    description,
  };

  const filePath = path.join(dir, `${version}.json`);
  fs.writeFileSync(filePath, JSON.stringify(entry, null, 2), 'utf-8');

  updateVersionIndex(dir, version);
  return entry;
}

export function loadSchemaVersion(version: string, dir: string): SchemaVersion {
  const filePath = path.join(dir, `${version}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Schema version '${version}' not found in ${dir}`);
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as SchemaVersion;
}

export function listSchemaVersions(dir: string): string[] {
  const indexPath = path.join(dir, 'index.json');
  if (!fs.existsSync(indexPath)) return [];
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8')) as SchemaVersionIndex;
  return index.versions;
}

export function getCurrentVersion(dir: string): string | null {
  const indexPath = path.join(dir, 'index.json');
  if (!fs.existsSync(indexPath)) return null;
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8')) as SchemaVersionIndex;
  return index.current || null;
}

function updateVersionIndex(dir: string, version: string): void {
  const indexPath = path.join(dir, 'index.json');
  let index: SchemaVersionIndex = { current: version, versions: [] };
  if (fs.existsSync(indexPath)) {
    index = JSON.parse(fs.readFileSync(indexPath, 'utf-8')) as SchemaVersionIndex;
  }
  if (!index.versions.includes(version)) {
    index.versions.push(version);
  }
  index.current = version;
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf-8');
}
