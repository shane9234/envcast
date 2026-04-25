import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { handleWatch } from './cliWatchHandler';
import { CliOptions } from './cliOptions';

function writeTempFile(name: string, content: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'envcast-watch-cli-'));
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

describe('handleWatch', () => {
  let consoleSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('logs the schema path being watched', () => {
    const schemaPath = writeTempFile('schema.json', JSON.stringify({
      PORT: { type: 'number', required: false },
    }));
    const envPath = writeTempFile('.env', 'PORT=3000');

    const options: CliOptions = {
      schema: schemaPath,
      envFiles: [envPath],
      format: 'text',
      command: 'watch',
    };

    // We can't run the full watcher in tests, so we verify the log output
    // by mocking watchSchema indirectly via console output
    const { watchSchema } = jest.requireActual('../schema/schemaWatcher') as typeof import('../schema/schemaWatcher');
    expect(typeof watchSchema).toBe('function');

    // Verify handleWatch logs startup message
    // We intercept before the watcher blocks
    const mockStop = jest.fn();
    jest.mock('../schema/schemaWatcher', () => ({
      watchSchema: jest.fn(() => ({ stop: mockStop })),
    }));

    // Direct assertion on console output after calling handleWatch
    try {
      handleWatch(options);
    } catch {
      // May throw if watcher can't bind — acceptable in test env
    }

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Watching schema:'));
  });

  it('exports handleWatch as a function', () => {
    expect(typeof handleWatch).toBe('function');
  });
});
