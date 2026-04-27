import { generateTemplate } from './schemaTemplater';
import { EnvSchema } from './types';

const sampleSchema: EnvSchema = {
  PORT: { type: 'number', required: true, description: 'Server port', default: 3000 },
  DEBUG: { type: 'boolean', required: false, description: 'Enable debug mode' },
  API_KEY: { type: 'string', required: true, description: 'External API key' },
  APP_NAME: { type: 'string', default: 'myapp' },
};

describe('generateTemplate', () => {
  it('should include all keys from schema', () => {
    const result = generateTemplate(sampleSchema);
    expect(result).toContain('PORT=');
    expect(result).toContain('DEBUG=');
    expect(result).toContain('API_KEY=');
    expect(result).toContain('APP_NAME=');
  });

  it('should use default values when includeDefaults is true', () => {
    const result = generateTemplate(sampleSchema, { includeDefaults: true });
    expect(result).toContain('PORT=3000');
    expect(result).toContain('APP_NAME=myapp');
  });

  it('should not use defaults when includeDefaults is false', () => {
    const result = generateTemplate(sampleSchema, { includeDefaults: false, placeholderStyle: 'type' });
    expect(result).toContain('PORT=<number>');
    expect(result).toContain('APP_NAME=<string>');
  });

  it('should include comments when includeComments is true', () => {
    const result = generateTemplate(sampleSchema, { includeComments: true });
    expect(result).toContain('# Server port');
    expect(result).toContain('# External API key');
  });

  it('should omit comments when includeComments is false', () => {
    const result = generateTemplate(sampleSchema, { includeComments: false });
    expect(result).not.toContain('# Server port');
  });

  it('should use type placeholders by default', () => {
    const result = generateTemplate({ ENABLED: { type: 'boolean' } }, { includeDefaults: false, placeholderStyle: 'type' });
    expect(result).toContain('ENABLED=<true|false>');
  });

  it('should use example values when placeholderStyle is example', () => {
    const result = generateTemplate(
      { COUNT: { type: 'number' }, FLAG: { type: 'boolean' }, NAME: { type: 'string' } },
      { includeDefaults: false, placeholderStyle: 'example' }
    );
    expect(result).toContain('COUNT=42');
    expect(result).toContain('FLAG=true');
    expect(result).toContain('NAME=example_value');
  });

  it('should use empty values when placeholderStyle is empty', () => {
    const result = generateTemplate({ KEY: { type: 'string' } }, { includeDefaults: false, placeholderStyle: 'empty' });
    expect(result).toContain('KEY=');
  });

  it('should mark required fields in comments', () => {
    const result = generateTemplate({ KEY: { type: 'string', required: true } }, { includeComments: true });
    expect(result).toContain('required');
  });

  it('should end with a newline', () => {
    const result = generateTemplate(sampleSchema);
    expect(result.endsWith('\n')).toBe(true);
  });
});
