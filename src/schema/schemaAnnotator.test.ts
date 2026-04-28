import { annotateSchema, buildAnnotations, formatAnnotatedSchema } from './schemaAnnotator';
import { EnvSchema } from './types';

const sampleSchema: EnvSchema = {
  DATABASE_URL: {
    type: 'string',
    required: true,
    secret: true,
    description: 'Database connection string',
  },
  PORT: {
    type: 'number',
    required: false,
    default: '3000',
    description: 'Server port',
  },
  DEBUG: {
    type: 'boolean',
    required: false,
  },
};

describe('buildAnnotations', () => {
  it('adds @required for required fields', () => {
    const annotations = buildAnnotations('KEY', { type: 'string', required: true });
    expect(annotations).toContain('@required');
  });

  it('adds @secret for secret fields', () => {
    const annotations = buildAnnotations('KEY', { type: 'string', secret: true });
    expect(annotations).toContain('@secret');
  });

  it('adds @default with value', () => {
    const annotations = buildAnnotations('KEY', { type: 'string', default: 'foo' });
    expect(annotations).toContain('@default(foo)');
  });

  it('adds @type annotation', () => {
    const annotations = buildAnnotations('KEY', { type: 'number' });
    expect(annotations).toContain('@type(number)');
  });

  it('adds @missing when required value is absent', () => {
    const annotations = buildAnnotations('KEY', { type: 'string', required: true }, {});
    expect(annotations).toContain('@missing');
  });

  it('adds @present when value exists', () => {
    const annotations = buildAnnotations('KEY', { type: 'string' }, { KEY: 'value' });
    expect(annotations).toContain('@present');
  });
});

describe('annotateSchema', () => {
  it('returns annotated fields for all schema keys', () => {
    const result = annotateSchema(sampleSchema);
    expect(result.fields).toHaveLength(3);
    expect(result.fields.map(f => f.key)).toEqual(['DATABASE_URL', 'PORT', 'DEBUG']);
  });

  it('counts total annotations', () => {
    const result = annotateSchema(sampleSchema);
    expect(result.totalAnnotations).toBeGreaterThan(0);
  });

  it('includes env value annotations when envValues provided', () => {
    const result = annotateSchema(sampleSchema, { PORT: '8080' });
    const port = result.fields.find(f => f.key === 'PORT');
    expect(port?.annotations).toContain('@present');
  });
});

describe('formatAnnotatedSchema', () => {
  it('formats annotated schema as readable string', () => {
    const annotated = annotateSchema(sampleSchema);
    const output = formatAnnotatedSchema(annotated);
    expect(output).toContain('DATABASE_URL:');
    expect(output).toContain('@required');
    expect(output).toContain('@secret');
    expect(output).toContain('# Database connection string');
  });

  it('includes default annotation in output', () => {
    const annotated = annotateSchema(sampleSchema);
    const output = formatAnnotatedSchema(annotated);
    expect(output).toContain('@default(3000)');
  });
});
