import * as fs from 'fs';
import * as path from 'path';
import { EnvSchema } from './types';
import { loadSchema } from './schemaLoader';
import { diffSchemas, isSchemaDiffEmpty } from './schemaDiff';

export interface WatchEvent {
  type: 'changed' | 'removed' | 'error';
  schemaPath: string;
  previous?: EnvSchema;
  current?: EnvSchema;
  error?: Error;
}

export type WatchCallback = (event: WatchEvent) => void;

export interface SchemaWatcher {
  stop: () => void;
}

export function watchSchema(
  schemaPath: string,
  callback: WatchCallback
): SchemaWatcher {
  const resolved = path.resolve(schemaPath);
  let previousSchema: EnvSchema | undefined;

  try {
    previousSchema = loadSchema(resolved);
  } catch {
    previousSchema = undefined;
  }

  const watcher = fs.watch(resolved, (eventType) => {
    if (eventType === 'rename') {
      callback({ type: 'removed', schemaPath: resolved, previous: previousSchema });
      previousSchema = undefined;
      return;
    }

    try {
      const current = loadSchema(resolved);
      if (previousSchema) {
        const diff = diffSchemas(previousSchema, current);
        if (!isSchemaDiffEmpty(diff)) {
          callback({ type: 'changed', schemaPath: resolved, previous: previousSchema, current });
        }
      } else {
        callback({ type: 'changed', schemaPath: resolved, current });
      }
      previousSchema = current;
    } catch (err) {
      callback({ type: 'error', schemaPath: resolved, error: err as Error });
    }
  });

  return {
    stop: () => watcher.close(),
  };
}
