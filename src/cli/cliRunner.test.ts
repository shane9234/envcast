import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { run } from './cliRunner';

function writeTempFile(name: string, content: string): string {
  const filePath = path.join(os.tmpdir(), name);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

describe('cliRunner', () => {
  let consoleSpy: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exits with error when no files provided', async () => {
    await run(['node', 'envcast']);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits with error when file does not exist', async () => {
    await run(['node', 'envcast', '/nonexistent/.env']);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('runs successfully with a valid env file', async () => {
    const envFile = writeTempFile('test-runner.env', 'PORT=3000\nNODE_ENV=development\n');
    await run(['node', 'envcast', envFile]);
    expect(consoleSpy).toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('writes output to file when --output is specified', async () => {
    const envFile = writeTempFile('test-output.env', 'KEY=value\n');
    const outFile = path.join(os.tmpdir(), 'envcast-report.txt');
    await run(['node', 'envcast', '--output', outFile, envFile]);
    expect(fs.existsSync(outFile)).toBe(true);
    fs.unlinkSync(outFile);
  });
});
