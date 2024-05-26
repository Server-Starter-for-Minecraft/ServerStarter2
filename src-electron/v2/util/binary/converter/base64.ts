import { Base64Decode, Base64Encode } from 'base64-stream';

export const fromBase64 = () => new Base64Decode();
export const toBase64 = () => new Base64Encode({ outputEncoding: null });

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  const { Bytes } = await import('../bytes');

  const testCases = [
    {
      converter: toBase64,
      srcText: 'test',
      convText: 'dGVzdA==',
    },
    {
      converter: fromBase64,
      srcText: 'c2FtcGxl',
      convText: 'sample',
    },
  ];

  test.each(testCases)('base64 ($srcText -> $convText)', async (tCase) => {
    const src = Bytes.fromString(tCase.srcText);
    expect(
      (await src.convert(tCase.converter()).into(Bytes)).value.toStr()
    ).toBe(tCase.convText);
  });
}
