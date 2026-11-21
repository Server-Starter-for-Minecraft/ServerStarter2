import { minimatch } from 'minimatch';
import { glob } from 'tinyglobby';
import { describe, expect, test } from 'vitest';
import {
  BACKEND_FILES,
  BACKEND_LAYERS,
  FRONTEND_FILES,
  FRONTEND_LAYERS,
  restrictedPackagePattern,
} from './config.js';

/** リポジトリのルート */
const ROOT = new URL('..', import.meta.url);

describe('層の定義', () => {
  // どの層にも属さないファイルは，import の方向が一切検査されないため，層の一覧への追記漏れを検出する
  // （層の判定は import-x/no-restricted-paths と同じ minimatch で行う）
  test.each([
    ['バックエンド', BACKEND_FILES, BACKEND_LAYERS],
    ['フロントエンド', FRONTEND_FILES, FRONTEND_LAYERS],
  ])(
    '%s のファイルは，すべてちょうど 1 つの層に属する',
    async (_, files, layers) => {
      const paths = await glob(files, {
        cwd: ROOT,
        ignore: ['**/node_modules/**', '**/work/**', '**/*.d.ts'],
      });
      expect(paths.length).toBeGreaterThan(0);

      const misclassified = paths.filter(
        (path) =>
          layers.filter((layer) =>
            layer.files.some((pattern) => minimatch(path, pattern))
          ).length !== 1
      );
      expect(misclassified).toEqual([]);
    }
  );
});

describe('restrictedPackagePattern', () => {
  const pattern = new RegExp(restrictedPackagePattern(['zod', 'dayjs/*']));

  test('許可していない外部パッケージに一致する', () => {
    expect(pattern.test('cheerio')).toBe(true);
    expect(pattern.test('@ngrok/ngrok')).toBe(true);
    expect(pattern.test('fs-extra')).toBe(true);
  });

  test('許可したパッケージ・その配下のモジュールには一致しない', () => {
    expect(pattern.test('zod')).toBe(false);
    expect(pattern.test('dayjs')).toBe(false);
    expect(pattern.test('dayjs/esm')).toBe(false);
  });

  test('パッケージ名の一部が一致するだけの別のパッケージには一致する', () => {
    expect(pattern.test('zod-extra')).toBe(true);
  });

  test('相対パス・プロジェクト内のエイリアスには一致しない', () => {
    expect(pattern.test('./local')).toBe(false);
    expect(pattern.test('../util/binary/path')).toBe(false);
    expect(pattern.test('app/src-electron/util/binary/path')).toBe(false);
    expect(pattern.test('src-electron/schema/brands')).toBe(false);
    expect(pattern.test('src/error/error')).toBe(false);
  });
});
