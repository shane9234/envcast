import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  saveSchemaVersion,
  loadSchemaVersion,
  listSchemaVersions,
  getCurrentVersion,
} from './schemaVersioning';
import { EnvSchema } from './types';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envcast-versioning-'));
}

const sampleSchema: EnvSchema = {
  fields: {
    API_KEY: { type: 'string', required: true, secret: true },
    PORT: { type: 'number', required: false, default: '3000' },
  },
};

describe('saveSchemaVersion', () => {
  it('writes a versioned file and returns the entry', () => {
    const dir = makeTempDir();
    const entry = saveSchemaVersion(sampleSchema, '1.0.0', dir, 'initial');
    expect(entry.version).toBe('1.0.0');
    expect(entry.description).toBe('initial');
    expect(entry.schema).toEqual(sampleSchema);
    expect(fs.existsSync(path.join(dir, '1.0.0.json'))).toBe(true);
  });

  it('creates the directory if it does not exist', () => {
    const dir = path.join(os.tmpdir(), `envcast-new-${Date.now()}`);
    saveSchemaVersion(sampleSchema, '1.0.0', dir);
    expect(fs.existsSync(dir)).toBe(true);
  });
});

describe('loadSchemaVersion', () => {
  it('loads a previously saved version', () => {
    const dir = makeTempDir();
    saveSchemaVersion(sampleSchema, '2.0.0', dir);
    const loaded = loadSchemaVersion('2.0.0', dir);
    expect(loaded.version).toBe('2.0.0');
    expect(loaded.schema).toEqual(sampleSchema);
  });

  it('throws if version does not exist', () => {
    const dir = makeTempDir();
    expect(() => loadSchemaVersion('9.9.9', dir)).toThrow("Schema version '9.9.9' not found");
  });
});

describe('listSchemaVersions', () => {
  it('returns empty array when no versions exist', () => {
    const dir = makeTempDir();
    expect(listSchemaVersions(dir)).toEqual([]);
  });

  it('returns all saved versions in order', () => {
    const dir = makeTempDir();
    saveSchemaVersion(sampleSchema, '1.0.0', dir);
    saveSchemaVersion(sampleSchema, '1.1.0', dir);
    saveSchemaVersion(sampleSchema, '2.0.0', dir);
    const versions = listSchemaVersions(dir);
    expect(versions).toContain('1.0.0');
    expect(versions).toContain('1.1.0');
    expect(versions).toContain('2.0.0');
    expect(versions.length).toBe(3);
  });
});

describe('getCurrentVersion', () => {
  it('returns null when no versions exist', () => {
    const dir = makeTempDir();
    expect(getCurrentVersion(dir)).toBeNull();
  });

  it('returns the most recently saved version', () => {
    const dir = makeTempDir();
    saveSchemaVersion(sampleSchema, '1.0.0', dir);
    saveSchemaVersion(sampleSchema, '1.2.0', dir);
    expect(getCurrentVersion(dir)).toBe('1.2.0');
  });
});
