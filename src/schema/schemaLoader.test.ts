import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { loadSchema, SchemaLoadError } from './schemaLoader';

function writeTempSchema(content: string, ext = '.json'): string {
  const filePath = path.join(os.tmpdir(), `envcast-schema-${Date.now()}${ext}`);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

describe('loadSchema', () => {
  it('loads a valid schema file', () => {
    const schemaPath = writeTempSchema(JSON.stringify({
      PORT: { type: 'number', required: true, description: 'Server port' },
      DEBUG: { type: 'boolean', required: false },
    }));

    const schema = loadSchema(schemaPath);
    expect(schema).toHaveProperty('PORT');
    expect(schema.PORT.type).toBe('number');
    expect(schema).toHaveProperty('DEBUG');
  });

  it('throws SchemaLoadError if file does not exist', () => {
    expect(() => loadSchema('/nonexistent/path/schema.json')).toThrow(SchemaLoadError);
    expect(() => loadSchema('/nonexistent/path/schema.json')).toThrow('Schema file not found');
  });

  it('throws SchemaLoadError for non-.json extension', () => {
    const filePath = writeTempSchema('{}', '.yaml');
    expect(() => loadSchema(filePath)).toThrow(SchemaLoadError);
    expect(() => loadSchema(filePath)).toThrow('must be a .json file');
  });

  it('throws SchemaLoadError for invalid JSON', () => {
    const filePath = writeTempSchema('{ not valid json }');
    expect(() => loadSchema(filePath)).toThrow(SchemaLoadError);
    expect(() => loadSchema(filePath)).toThrow('invalid JSON');
  });

  it('throws SchemaLoadError if root is not an object', () => {
    const filePath = writeTempSchema(JSON.stringify([1, 2, 3]));
    expect(() => loadSchema(filePath)).toThrow(SchemaLoadError);
    expect(() => loadSchema(filePath)).toThrow('must be a JSON object');
  });

  it('throws SchemaLoadError if an entry is missing "type"', () => {
    const filePath = writeTempSchema(JSON.stringify({
      PORT: { required: true },
    }));
    expect(() => loadSchema(filePath)).toThrow(SchemaLoadError);
    expect(() => loadSchema(filePath)).toThrow('missing required field "type"');
  });

  it('throws SchemaLoadError for an invalid type value', () => {
    const filePath = writeTempSchema(JSON.stringify({
      PORT: { type: 'integer' },
    }));
    expect(() => loadSchema(filePath)).toThrow(SchemaLoadError);
    expect(() => loadSchema(filePath)).toThrow('invalid type');
  });

  it('accepts all valid type values', () => {
    const filePath = writeTempSchema(JSON.stringify({
      A: { type: 'string' },
      B: { type: 'number' },
      C: { type: 'boolean' },
      D: { type: 'url' },
      E: { type: 'email' },
    }));
    const schema = loadSchema(filePath);
    expect(Object.keys(schema)).toHaveLength(5);
  });
});
