#!/usr/bin/env node
import { run } from './cli/cliRunner';

run(process.argv).catch((err: Error) => {
  console.error('Unexpected error:', err.message);
  process.exit(1);
});
