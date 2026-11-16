import { describe, expect, test } from 'vitest';
import { Path } from 'app/src-electron/util/binary/path';
import { isValid } from 'app/src-electron/util/error/error';
import { distributionPath } from './definition';
import { outerResourceDefinitions } from './definitions';

/** 同梱データの保存先（`bun run outer-resources pull` の書き出し先） */
const bundledDir = new Path(__dirname).child('bundled');

/**
 * アプリに同梱する外部リソースは，配布元から取得できない初回起動時に表示されるため，
 * アプリのスキーマを厳格に満たし，オフラインでも表示できる（画像を参照しない）ことを確認する
 */
describe('同梱の外部リソース', () => {
  test.each(Object.values(outerResourceDefinitions))(
    '$fileName がアプリのスキーマを厳格に満たす（不正な要素が1つもない）',
    async (def) => {
      const text = await bundledDir.child(distributionPath(def)).readText();
      expect(isValid(text)).toBe(true);
      const parsed = def.schema.safeParse(JSON.parse(text as string));
      expect(parsed.error?.issues).toBeUndefined();
      // 不正な要素を除いて読み込んだ結果も，同梱データと同じ内容になる
      expect(def.bundled).toEqual(parsed.data);
    }
  );

  test.each(Object.values(outerResourceDefinitions))(
    '$fileName はネットワークから取得する画像を参照しない',
    (def) => {
      const urls = JSON.stringify(def.bundled).match(/"(icon|image)":"[^"]*"/g);
      for (const url of urls ?? []) expect(url).toMatch(/:"data:image\//);
    }
  );
});
