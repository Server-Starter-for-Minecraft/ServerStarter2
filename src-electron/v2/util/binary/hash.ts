import { Err, Result, err, ok } from '../base';
import { IWritableStreamer } from './stream';
import { createHash } from 'crypto';
import { asyncPipe } from './util';

type HashAlgorithm = 'sha256' | 'sha1' | 'md5';
function hashFunc(algorithm: HashAlgorithm): IWritableStreamer<string> {
  return {
    write(readable) {
      const e: undefined | Err<Error> = undefined;

      const hash = createHash(algorithm);
      return asyncPipe(readable, hash).then((result) =>
        result.map(() => hash.digest().toString('hex'))
      );
    },
  };
}

export const SHA256: IWritableStreamer<string> = hashFunc('sha256');
export const SHA1: IWritableStreamer<string> = hashFunc('sha1');
export const MD5: IWritableStreamer<string> = hashFunc('md5');

/** In Source Testing */
if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest;
  describe('hashGroup', async () => {
    const { Bytes } = await import('./bytes');
    const src = Bytes.fromString('test');

    const testCases = [
      {
        algorithm: SHA256,
        value:
          '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      },
      {
        algorithm: SHA1,
        value: 'a94a8fe5ccb19ba61c4c0873d391e987982fbbd3',
      },
      {
        algorithm: MD5,
        value: '098f6bcd4621d373cade4e832627b4f6',
      },
    ];

    test.each(testCases)('hash', async (tCase) => {
      expect((await src.into(tCase.algorithm)).value).toBe(tCase.value);
    });
  });
}
