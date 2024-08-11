import { Base64Decode, Base64Encode } from 'base64-stream';
import { randomBytes, randomInt } from 'crypto';
import { createGunzip, createGzip } from 'zlib';

export const fromGzip = createGunzip;
export const toGzip = createGzip;

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  const { Bytes } = await import('../bytes');

  test('gzip', async () => {
    // ランダムなバイト列で検証
    const ramdomBytes = randomBytes(randomInt(100));
    const src = new Bytes(ramdomBytes);
    const converted = await src
      .convert(toGzip())
      .convert(fromGzip())
      .into(Bytes);
    expect(converted.onOk((x) => x.toStr('base64')).value()).toBe(
      src.toStr('base64').value()
    );
  });
}
