import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { watchSchema, WatchEvent } from './schemaWatcher';

function writeTempSchema(content: object): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'envcast-watch-'));
  const filePath = path.join(dir, 'schema.json');
  fs.writeFileSync(filePath, JSON.stringify(content), 'utf-8');
  return filePath;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('watchSchema', () => {
  it('calls callback with changed event when schema is updated', async () => {
    const schemaPath = writeTempSchema({
      PORT: { type: 'number', required: true },
    });

    const events: WatchEvent[] = [];
    const watcher = watchSchema(schemaPath, (event) => events.push(event));

    await delay(100);
    fs.writeFileSync(
      schemaPath,
      JSON.stringify({ PORT: { type: 'number', required: true }, HOST: { type: 'string', required: false } }),
      'utf-8'
    );
    await delay(300);

    watcher.stop();

    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events[0].type).toBe('changed');
    expect(events[0].current).toHaveProperty('HOST');
  });

  it('does not emit event when schema content is unchanged', async () => {
    const schema = { PORT: { type: 'number', required: true } };
    const schemaPath = writeTempSchema(schema);

    const events: WatchEvent[] = [];
    const watcher = watchSchema(schemaPath, (event) => events.push(event));

    await delay(100);
    fs.writeFileSync(schemaPath, JSON.stringify(schema), 'utf-8');
    await delay(300);

    watcher.stop();

    expect(events.filter((e) => e.type === 'changed')).toHaveLength(0);
  });

  it('stop() prevents further callbacks', async () => {
    const schemaPath = writeTempSchema({ PORT: { type: 'number', required: true } });
    const events: WatchEvent[] = [];
    const watcher = watchSchema(schemaPath, (event) => events.push(event));

    watcher.stop();
    await delay(100);
    fs.writeFileSync(schemaPath, JSON.stringify({ HOST: { type: 'string', required: false } }), 'utf-8');
    await delay(300);

    expect(events).toHaveLength(0);
  });
});
