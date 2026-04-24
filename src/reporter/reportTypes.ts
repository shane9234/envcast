export type ValidationStatus = 'valid' | 'missing' | 'invalid' | 'extra';

export interface VariableReport {
  key: string;
  status: ValidationStatus;
  value?: string;
  expectedType?: string;
  message?: string;
  source?: string;
}

export interface EnvReport {
  file: string;
  variables: VariableReport[];
  summary: {
    total: number;
    valid: number;
    missing: number;
    invalid: number;
    extra: number;
  };
}

export interface MultiEnvReport {
  reports: EnvReport[];
  conflicts: Record<string, string[]>;
  overallStatus: 'pass' | 'fail';
}

export type ReportFormat = 'text' | 'json' | 'markdown';
