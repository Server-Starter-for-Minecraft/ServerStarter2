import { describe, expect, test } from 'vitest';
import { Version } from 'app/src-electron/schema/version';
import { getVersionId } from './version';

describe('getVersionId', () => {
  test('バージョンIDを持つバージョンはそのIDを返す', () => {
    const vanilla = Version.parse({
      type: 'vanilla',
      id: '1.20.4',
      release: true,
    });
    const papermc = Version.parse({
      type: 'papermc',
      id: '1.20.4',
      build: 100,
    });

    expect(getVersionId(vanilla)).toBe('1.20.4');
    expect(getVersionId(papermc)).toBe('1.20.4');
  });

  test('不明なバージョンは空文字を返す（undefinedを表示しない）', () => {
    const unknown = Version.parse({ type: 'unknown' });

    expect(getVersionId(unknown)).toBe('');
  });
});
