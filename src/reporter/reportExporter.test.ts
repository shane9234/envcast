import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { exportReport, serializeReport, resolveOutputPath } from './reportExporter';
import { EnvReport } from './reportTypes';

const sampleReport: EnvReport = {
  source: '.env',
  entries: [
    { key: 'PORT', value: '3000', valid: true, type: 'number' },
    { key: 'SECRET', value: '***', valid: true, type: 'string', masked: true },
  ],
  missingRequired: [],
  invalidEntries: [],
};

function makeTempPath(name: string): string {
  return path.join(os.tmpdir(), `envcast-export-test-${Date.now()}-${name}`);
}

describe('serializeReport', () => {
  it('returns JSON string for json format', () => {
    const result = serializeReport(sampleReport, 'json');
    const parsed = JSON.parse(result);
    expect(parsed.source).toBe('.env');
    expect(parsed.entries).toHaveLength(2);
  });

  it('returns non-empty string for text format', () => {
    const result = serializeReport(sampleReport, 'text');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns non-empty string for markdown format', () => {
    const result = serializeReport(sampleReport, 'markdown');
    expect(result).toContain('#');
  });
});

describe('resolveOutputPath', () => {
  it('appends .json extension for json format', () => {
    expect(resolveOutputPath('report', 'json')).toBe('report.json');
  });

  it('appends .md extension for markdown format', () => {
    expect(resolveOutputPath('report', 'markdown')).toBe('report.md');
  });

  it('does not double-append extension', () => {
    expect(resolveOutputPath('report.md', 'markdown')).toBe('report.md');
  });
});

describe('exportReport', () => {
  it('writes a JSON file to disk', () => {
    const outPath = makeTempPath('out.json');
    exportReport(sampleReport, { format: 'json', outputPath: outPath });
    const content = fs.readFileSync(outPath, 'utf-8');
    expect(JSON.parse(content).source).toBe('.env');
    fs.unlinkSync(outPath);
  });

  it('throws if file exists and overwrite is false', () => {
    const outPath = makeTempPath('exists.json');
    fs.writeFileSync(outPath, '{}');
    expect(() =>
      exportReport(sampleReport, { format: 'json', outputPath: outPath, overwrite: false })
    ).toThrow('already exists');
    fs.unlinkSync(outPath);
  });

  it('overwrites file when overwrite is true', () => {
    const outPath = makeTempPath('overwrite.json');
    fs.writeFileSync(outPath, '{}');
    exportReport(sampleReport, { format: 'json', outputPath: outPath, overwrite: true });
    const content = fs.readFileSync(outPath, 'utf-8');
    expect(JSON.parse(content).source).toBe('.env');
    fs.unlinkSync(outPath);
  });
});
