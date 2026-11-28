import { assertOk } from 'app/test/util/assert';
import { describe, expect, test } from 'vitest';
import { ImageURI } from 'app/src-electron/schema/brands';
import { Path } from 'app/src-electron/util/binary/path';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { isValid } from 'app/src-electron/util/error/error';
import { asBrand } from 'app/src-electron/util/zod/brand';
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
      // 厳格なスキーマで読み込めない場合はエラー（検証の内容）が表示される
      const strict = await bundledDir
        .child(distributionPath(def))
        .readJson(def.schema);
      assertOk(strict);
      // 不正な要素を除いて読み込んだ結果も，同梱データと同じ内容になる
      expect(def.bundled).toEqual(strict);
    }
  );

  // 画像を参照する（同梱時に画像を取り込む）外部リソース
  const withAssets = Object.values(outerResourceDefinitions).flatMap((def) =>
    def.embedAssets === undefined
      ? []
      : [{ ...def, embedAssets: def.embedAssets.bind(def) }]
  );

  test.each(withAssets)(
    '$fileName はネットワークから取得する画像を参照しない',
    async (def) => {
      // data URI 以外の画像を読み込もうとした場合は失敗させ，同梱データが画像を取り込み済みであることを確かめる
      const loadImage = async (source: string) =>
        source.startsWith('data:image/')
          ? asBrand(ImageURI, source)
          : errorMessage.data.url.unsupported({ url: source });
      expect(isValid(await def.embedAssets(def.bundled, loadImage))).toBe(true);
    }
  );
});
