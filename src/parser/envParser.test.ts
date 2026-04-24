import { parseEnvContent, ParseResult } from './envParser';

describe('parseEnvContent', () => {
  it('parses simple key=value pairs', () => {
    const result = parseEnvContent('PORT=3000\nHOST=localhost');
    expect(result.entries).toHaveLength(2);
    expect(result.entries[0]).toMatchObject({ key: 'PORT', value: '3000', lineNumber: 1 });
    expect(result.entries[1]).toMatchObject({ key: 'HOST', value: 'localhost', lineNumber: 2 });
    expect(result.errors).toHaveLength(0);
  });

  it('ignores comment lines', () => {
    const result = parseEnvContent('# This is a comment\nPORT=3000');
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].key).toBe('PORT');
  });

  it('ignores blank lines', () => {
    const result = parseEnvContent('PORT=3000\n\nHOST=localhost');
    expect(result.entries).toHaveLength(2);
  });

  it('strips double quotes from values', () => {
    const result = parseEnvContent('DATABASE_URL="postgres://localhost/db"');
    expect(result.entries[0].value).toBe('postgres://localhost/db');
  });

  it('strips single quotes from values', () => {
    const result = parseEnvContent("SECRET='my-secret'");
    expect(result.entries[0].value).toBe('my-secret');
  });

  it('strips inline comments from values', () => {
    const result = parseEnvContent('PORT=3000 # default port');
    expect(result.entries[0].value).toBe('3000');
  });

  it('handles empty values', () => {
    const result = parseEnvContent('EMPTY=');
    expect(result.entries[0]).toMatchObject({ key: 'EMPTY', value: '' });
  });

  it('records parse errors for invalid lines', () => {
    const result = parseEnvContent('INVALID LINE WITHOUT EQUALS');
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].reason).toBe('Invalid key=value format');
    expect(result.errors[0].lineNumber).toBe(1);
  });

  it('attaches filePath to entries and errors', () => {
    const result = parseEnvContent('PORT=3000\nBAD', '.env.test');
    expect(result.entries[0].filePath).toBe('.env.test');
    expect(result.errors[0].filePath).toBe('.env.test');
  });

  it('handles values with equals signs', () => {
    const result = parseEnvContent('JWT_SECRET=abc=def==');
    expect(result.entries[0].value).toBe('abc=def==');
  });
});
