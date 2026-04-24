import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { loadEnvFiles, getConflicts } from './multiEnvLoader';

function writeTempFile(content: string): string {
  const tmpPath = path.join(os.tmpdir(), `envcast-test-${Date.now()}-${Math.random()}.env`);
  fs.writeFileSync(tmpPath, content, 'utf-8');
  return tmpPath;
}

describe('loadEnvFiles', () => {
  it('loads entries from multiple files', () => {
    const f1 = writeTempFile('PORT=3000\nHOST=localhost');
    const f2 = writeTempFile('DB_URL=postgres://localhost/test');
    const result = loadEnvFiles([f1, f2]);
    expect(result.filesLoaded).toHaveLength(2);
    expect(result.entries.has('PORT')).toBe(true);
    expect(result.entries.has('DB_URL')).toBe(true);
    fs.unlinkSync(f1);
    fs.unlinkSync(f2);
  });

  it('records failed files for missing paths', () => {
    const result = loadEnvFiles(['/nonexistent/.env']);
    expect(result.filesFailed).toHaveLength(1);
    expect(result.errors[0].reason).toContain('File not found');
  });

  it('collects parse errors but continues loading by default', () => {
    const f1 = writeTempFile('VALID=yes\nINVALID LINE');
    const result = loadEnvFiles([f1]);
    expect(result.filesLoaded).toContain(f1);
    expect(result.errors).toHaveLength(1);
    expect(result.entries.has('VALID')).toBe(true);
    fs.unlinkSync(f1);
  });

  it('tracks duplicate keys across files', () => {
    const f1 = writeTempFile('PORT=3000');
    const f2 = writeTempFile('PORT=4000');
    const result = loadEnvFiles([f1, f2]);
    const portEntries = result.entries.get('PORT')!;
    expect(portEntries).toHaveLength(2);
    fs.unlinkSync(f1);
    fs.unlinkSync(f2);
  });
});

describe('getConflicts', () => {
  it('returns keys defined in more than one file', () => {
    const f1 = writeTempFile('PORT=3000\nHOST=a');
    const f2 = writeTempFile('PORT=4000');
    const { entries } = loadEnvFiles([f1, f2]);
    const conflicts = getConflicts(entries);
    expect(conflicts.has('PORT')).toBe(true);
    expect(conflicts.has('HOST')).toBe(false);
    fs.unlinkSync(f1);
    fs.unlinkSync(f2);
  });

  it('returns empty map when no conflicts exist', () => {
    const f1 = writeTempFile('A=1\nB=2');
    const { entries } = loadEnvFiles([f1]);
    const conflicts = getConflicts(entries);
    expect(conflicts.size).toBe(0);
    fs.unlinkSync(f1);
  });
});
