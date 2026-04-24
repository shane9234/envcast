export interface CliOptions {
  files: string[];
  schema?: string;
  format: 'text' | 'markdown' | 'json';
  maskSecrets: boolean;
  strict: boolean;
  output?: string;
}

export const DEFAULT_CLI_OPTIONS: Omit<CliOptions, 'files'> = {
  format: 'text',
  maskSecrets: true,
  strict: false,
};

export function parseArgs(argv: string[]): CliOptions {
  const args = argv.slice(2);
  const options: CliOptions = {
    files: [],
    ...DEFAULT_CLI_OPTIONS,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--schema':
      case '-s':
        options.schema = args[++i];
        break;
      case '--format':
      case '-f':
        options.format = args[++i] as CliOptions['format'];
        break;
      case '--no-mask':
        options.maskSecrets = false;
        break;
      case '--strict':
        options.strict = true;
        break;
      case '--output':
      case '-o':
        options.output = args[++i];
        break;
      default:
        if (!arg.startsWith('-')) {
          options.files.push(arg);
        }
    }
  }

  return options;
}
