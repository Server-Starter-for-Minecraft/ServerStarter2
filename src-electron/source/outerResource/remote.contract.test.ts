import { describe, expect, test } from 'vitest';
import { DonationResourceV1 } from 'app/src-electron/schema/outerResource/donation';
import { BytesData } from 'app/src-electron/util/binary/bytesData';
import { isError } from 'app/src-electron/util/error/error';
import { OUTER_RESOURCE_BASE_URL } from '../const';
import { distributionPath } from './definition';
import { outerResourceDefinitions } from './definitions';
import { generateJsonSchemas } from './distribution';
import { donationDefinition } from './resources/donation';

/**
 * 配布元（OuterResources リポジトリの main）の内容が，アプリが読み込める形になっていることを確認する
 *
 * 配布元のリポジトリでも公開前に JSON Schema で検証しているが，
 * アプリ側のスキーマとのずれや配布元の障害を検知するため，実際の配布ファイルを取得して検証する
 */
describe('外部リソースの配布元', { tags: ['network'] }, () => {
  /** 配布ファイルを取得して JSON として返す */
  async function fetchJson(path: string): Promise<unknown> {
    const data = await BytesData.fromURL(`${OUTER_RESOURCE_BASE_URL}/${path}`);
    if (isError(data)) throw new Error(`failed to fetch ${path}`);
    return JSON.parse(await data.text());
  }

  test.each(Object.values(outerResourceDefinitions))(
    '$fileName がアプリのスキーマを厳格に満たす（不正な要素が1つもない）',
    async (def) => {
      const parsed = def.schema.safeParse(
        await fetchJson(distributionPath(def))
      );
      expect(parsed.error?.issues).toBeUndefined();
    }
  );

  test('寄付サービスのアイコンをすべて取得できる', async () => {
    const path = distributionPath(donationDefinition);
    const { services } = DonationResourceV1.parse(await fetchJson(path));
    for (const { icon } of services) {
      if (icon === undefined || icon.startsWith('data:')) continue;
      const url = new URL(icon, `${OUTER_RESOURCE_BASE_URL}/${path}`).href;
      expect(isError(await BytesData.fromURL(url)), icon).toBe(false);
    }
  });

  test.each(Object.entries(generateJsonSchemas()))(
    '配布元の %s がアプリのスキーマと一致する',
    async (path, schema) => {
      expect(await fetchJson(path)).toEqual(schema);
    }
  );
});
