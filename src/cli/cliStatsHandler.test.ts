import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { handleStats, serializeStats } from './cliStatsHandler';
import { SchemaStats } from '../schema/schemaStats';

function writeTempSchema(content: object): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'envcast-stats-'));
  const filePath = path.join(dir, 'schema.json');
  fs.writeFileSync(filePath, JSON.stringify(content), 'utf-8');
  return filePath;
}

const sampleSchema = {
  PORT: { type: 'number', required: true, description: 'App port', default: '3000' },
  SECRET_KEY: { type: 'string', required: true, secret: true, description: 'Secret' },
  DEBUG: { type: 'boolean', required: false },
};

describe('serializeStats', () => {
  const stats: SchemaStats = {
    totalFields: 3,
    requiredFields: 2,
    optionalFields: 1,
    secretFields: 1,
    fieldsByType: { number: 1, string: 1, boolean: 1 },
    withDefault: 1,
    withDescription: 2,
    withPattern: 0,
    coverageScore: 72,
  };

  it('returns JSON string when format is json', () => {
    const result = serializeStats(stats, 'json');
    const parsed = JSON.parse(result);
    expect(parsed.totalFields).toBe(3);
    expect(parsed.coverageScore).toBe(72);
  });

  it('returns text string when format is text', () => {
    const result = serializeStats(stats, 'text');
    expect(result).toContain('Total fields');
    expect(result).toContain('Coverage score');
  });
});

describe('handleStats', () => {
  it('prints stats to stdout without output option', async () => {
    const schemaPath = writeTempSchema(sampleSchema);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await handleStats({ schemaPath, format: 'text' });
    expect(spy).toHaveBeenCalled();
    const output = spy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(output).toContain('Total fields');
    spy.mockRestore();
  });

  it('writes stats to file when output is specified', async () => {
    const schemaPath = writeTempSchema(sampleSchema);
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envcast-stats-out-'));
    const outFile = path.join(outDir, 'stats.json');
    await handleStats({ schemaPath, format: 'json', output: outFile });
    expect(fs.existsSync(outFile)).toBe(true);
    const content = JSON.parse(fs.readFileSync(outFile, 'utf-8'));
    expect(content.totalFields).toBe(3);
  });

  it('computes correct stats for sample schema', async () => {
    const schemaPath = writeTempSchema(sampleSchema);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await handleStats({ schemaPath, format: 'json' });
    const output = spy.mock.calls.map((c) => c.join(' ')).join('\n');
    const parsed = JSON.parse(output);
    expect(parsed.requiredFields).toBe(2);
    expect(parsed.secretFields).toBe(1);
    spy.mockRestore();
  });
});
