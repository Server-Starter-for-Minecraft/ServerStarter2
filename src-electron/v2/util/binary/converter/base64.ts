// https://www.npmjs.com/package/base64-stream

import { Base64Decode, Base64Encode } from 'base64-stream';

export const fromBase64 = new Base64Decode();
export const toBase64 = new Base64Encode({ outputEncoding: "utf8" });

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  const { Bytes } = await import('../bytes');

  const testCases = [
    {
      srcText: 'test',
      convText: 'dGVzdA==',
    },
    {
      srcText: 'c2FtcGxl',
      convText: 'sample',
    },
  ];

  test.each(testCases)('base64', async (tCase) => {
    const src = Bytes.fromString(tCase.srcText);
    expect((await src.convert(fromBase64).into(Bytes)).value).toBe(tCase.convText);
  });
}

