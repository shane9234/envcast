import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { resolveGroupMode, handleGroupSchema } from './cliGroupSchemaHandler';

function writeTempSchema(content: object): string {
  const tmpFile = path.join(os.tmpdir(), `schema-${Date.now()}.json`);
  fs.writeFileSync(tmpFile, JSON.stringify(content), 'utf-8');
  return tmpFile;
}

function makeTempPath(): string {
  return path.join(os.tmpdir(), `grouped-${Date.now()}.txt`);
}

describe('resolveGroupMode', () => {
  it('returns prefix for undefined', () => {
    expect(resolveGroupMode(undefined)).toBe('prefix');
  });

  it('returns tag for "tag"', () => {
    expect(resolveGroupMode('tag')).toBe('tag');
  });

  it('returns required for "required"', () => {
    expect(resolveGroupMode('required')).toBe('required');
  });

  it('falls back to prefix for unknown values', () => {
    expect(resolveGroupMode('unknown')).toBe('prefix');
  });
});

describe('handleGroupSchema', () => {
  const schema = {
    DB_HOST: { type: 'string', required: true },
    DB_PORT: { type: 'number', required: true },
    APP_NAME: { type: 'string', required: false },
  };

  it('prints grouped output to stdout when no output path given', async () => {
    const schemaPath = writeTempSchema(schema);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await handleGroupSchema({ schema: schemaPath, groupBy: 'prefix' } as any);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
    fs.unlinkSync(schemaPath);
  });

  it('writes output to file when output path is given', async () => {
    const schemaPath = writeTempSchema(schema);
    const outPath = makeTempPath();
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await handleGroupSchema({ schema: schemaPath, groupBy: 'prefix', output: outPath } as any);
    expect(fs.existsSync(outPath)).toBe(true);
    const content = fs.readFileSync(outPath, 'utf-8');
    expect(content).toContain('DB');
    spy.mockRestore();
    fs.unlinkSync(schemaPath);
    fs.unlinkSync(outPath);
  });

  it('exits with error when schema path is missing', async () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const mockError = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(handleGroupSchema({} as any)).rejects.toThrow('exit');
    mockExit.mockRestore();
    mockError.mockRestore();
  });
});
