import { formatReport } from './reportFormatter';
import { MultiEnvReport } from './reportTypes';

const sampleReport: MultiEnvReport = {
  overallStatus: 'fail',
  conflicts: { PORT: ['.env', '.env.local'] },
  reports: [
    {
      file: '.env',
      variables: [
        { key: 'PORT', status: 'invalid', value: 'abc', expectedType: 'number', message: 'Expected number' },
        { key: 'API_KEY', status: 'missing', expectedType: 'string', message: 'Required variable is missing' },
        { key: 'DEBUG', status: 'valid', value: 'true', expectedType: 'boolean' },
      ],
      summary: { total: 3, valid: 1, missing: 1, invalid: 1, extra: 0 },
    },
  ],
};

describe('formatReport - text', () => {
  it('includes overall status', () => {
    const output = formatReport(sampleReport, 'text');
    expect(output).toContain('FAIL');
  });

  it('includes file name', () => {
    const output = formatReport(sampleReport, 'text');
    expect(output).toContain('.env');
  });

  it('includes conflict info', () => {
    const output = formatReport(sampleReport, 'text');
    expect(output).toContain('Conflicts');
    expect(output).toContain('PORT');
  });
});

describe('formatReport - json', () => {
  it('returns valid JSON', () => {
    const output = formatReport(sampleReport, 'json');
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it('contains all report fields', () => {
    const parsed = JSON.parse(formatReport(sampleReport, 'json'));
    expect(parsed).toHaveProperty('overallStatus');
    expect(parsed).toHaveProperty('reports');
    expect(parsed).toHaveProperty('conflicts');
  });
});

describe('formatReport - markdown', () => {
  it('includes markdown heading', () => {
    const output = formatReport(sampleReport, 'markdown');
    expect(output).toContain('# Env Validation Report');
  });

  it('includes table headers', () => {
    const output = formatReport(sampleReport, 'markdown');
    expect(output).toContain('| Variable |');
  });

  it('includes variable rows', () => {
    const output = formatReport(sampleReport, 'markdown');
    expect(output).toContain('PORT');
    expect(output).toContain('API_KEY');
  });
});
