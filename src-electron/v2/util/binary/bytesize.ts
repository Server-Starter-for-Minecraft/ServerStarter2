import { ok } from '../base';
import { WritableStreamer } from './stream';

export const bytesize: WritableStreamer<number> = {
  async write(readable) {
    let size = 0;
    readable.on('data', (chunk: Buffer) => (size += chunk.length));
    await new Promise((r) => readable.on('close', r));
    return ok(size);
  },
};

/** In Source Testing */
if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest;
  describe('hashGroup', async () => {
    const { Bytes } = await import('./bytes');
    test('size', async () => {
      expect((await Bytes.fromString('hello').into(bytesize)).value()).toBe(5);
      expect((await new Bytes(Buffer.alloc(123)).into(bytesize)).value()).toBe(
        123
      );
    });
  });
}