import { parseArgs, DEFAULT_CLI_OPTIONS } from './cliOptions';

describe('parseArgs', () => {
  it('parses file arguments', () => {
    const opts = parseArgs(['node', 'envcast', '.env', '.env.local']);
    expect(opts.files).toEqual(['.env', '.env.local']);
  });

  it('applies default options', () => {
    const opts = parseArgs(['node', 'envcast', '.env']);
    expect(opts.format).toBe(DEFAULT_CLI_OPTIONS.format);
    expect(opts.maskSecrets).toBe(DEFAULT_CLI_OPTIONS.maskSecrets);
    expect(opts.strict).toBe(DEFAULT_CLI_OPTIONS.strict);
  });

  it('parses --schema flag', () => {
    const opts = parseArgs(['node', 'envcast', '--schema', 'schema.json', '.env']);
    expect(opts.schema).toBe('schema.json');
  });

  it('parses -s shorthand for schema', () => {
    const opts = parseArgs(['node', 'envcast', '-s', 'schema.json', '.env']);
    expect(opts.schema).toBe('schema.json');
  });

  it('parses --format flag', () => {
    const opts = parseArgs(['node', 'envcast', '--format', 'markdown', '.env']);
    expect(opts.format).toBe('markdown');
  });

  it('parses --no-mask flag', () => {
    const opts = parseArgs(['node', 'envcast', '--no-mask', '.env']);
    expect(opts.maskSecrets).toBe(false);
  });

  it('parses --strict flag', () => {
    const opts = parseArgs(['node', 'envcast', '--strict', '.env']);
    expect(opts.strict).toBe(true);
  });

  it('parses --output flag', () => {
    const opts = parseArgs(['node', 'envcast', '--output', 'report.md', '.env']);
    expect(opts.output).toBe('report.md');
  });

  it('returns empty files array when no files given', () => {
    const opts = parseArgs(['node', 'envcast']);
    expect(opts.files).toHaveLength(0);
  });
});
