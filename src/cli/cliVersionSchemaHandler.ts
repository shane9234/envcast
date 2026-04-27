import * as path from 'path';
import { loadSchema } from '../schema/schemaLoader';
import {
  saveSchemaVersion,
  loadSchemaVersion,
  listSchemaVersions,
  getCurrentVersion,
} from '../schema/schemaVersioning';
import { CliOptions } from './cliOptions';

const DEFAULT_VERSIONS_DIR = '.envcast/versions';

export function handleSchemaVersion(options: CliOptions): void {
  const versionsDir = options.versionsDir
    ? path.resolve(options.versionsDir)
    : path.resolve(DEFAULT_VERSIONS_DIR);

  const subcommand = options.versionCommand;

  if (subcommand === 'list') {
    handleList(versionsDir);
  } else if (subcommand === 'save') {
    handleSave(options, versionsDir);
  } else if (subcommand === 'load') {
    handleLoad(options, versionsDir);
  } else if (subcommand === 'current') {
    handleCurrent(versionsDir);
  } else {
    console.error(`Unknown version subcommand: '${subcommand}'`);
    console.error('Available subcommands: list, save, load, current');
    process.exit(1);
  }
}

function handleList(dir: string): void {
  const versions = listSchemaVersions(dir);
  if (versions.length === 0) {
    console.log('No schema versions found.');
    return;
  }
  const current = getCurrentVersion(dir);
  console.log('Schema versions:');
  for (const v of versions) {
    const marker = v === current ? ' (current)' : '';
    console.log(`  ${v}${marker}`);
  }
}

function handleSave(options: CliOptions, dir: string): void {
  const schemaPath = options.schema || 'envcast.schema.json';
  const version = options.version;
  if (!version) {
    console.error('Error: --version is required for the save subcommand.');
    process.exit(1);
  }
  const schema = loadSchema(path.resolve(schemaPath));
  const entry = saveSchemaVersion(schema, version, dir, options.description);
  console.log(`Schema version '${entry.version}' saved at ${entry.timestamp}`);
}

function handleLoad(options: CliOptions, dir: string): void {
  const version = options.version;
  if (!version) {
    console.error('Error: --version is required for the load subcommand.');
    process.exit(1);
  }
  try {
    const entry = loadSchemaVersion(version, dir);
    console.log(`Schema version '${entry.version}' (${entry.timestamp})`);
    if (entry.description) console.log(`Description: ${entry.description}`);
    console.log(JSON.stringify(entry.schema, null, 2));
  } catch (err: unknown) {
    console.error((err as Error).message);
    process.exit(1);
  }
}

function handleCurrent(dir: string): void {
  const current = getCurrentVersion(dir);
  if (!current) {
    console.log('No current version set.');
  } else {
    console.log(`Current schema version: ${current}`);
  }
}
