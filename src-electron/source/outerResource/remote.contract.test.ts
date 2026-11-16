import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { DonationResourceV1 } from 'app/src-electron/schema/outerResource/donation';
import { ServerPropertiesResourceV1 } from 'app/src-electron/schema/outerResource/serverProperties';
import { BytesData } from 'app/src-electron/util/binary/bytesData';
import { isError } from 'app/src-electron/util/error/error';
import { OUTER_RESOURCE_BASE_URL } from '../const';
import {
  DISTRIBUTION_SCHEMA_VERSION,
  generateJsonSchemas,
} from './distribution';

/**
 * 配布元（OuterResources リポジトリの main）の内容が，アプリが読み込める形になっていることを確認する
 *
 * 配布元のリポジトリでも公開前に JSON Schema で検証しているが，
 * アプリ側のスキーマとのずれや配布元の障害を検知するため，実際の配布ファイルを取得して検証する
 */
describe('外部リソースの配布元', { tags: ['network'] }, () => {
  const dirUrl = `${OUTER_RESOURCE_BASE_URL}/v${DISTRIBUTION_SCHEMA_VERSION}`;

  /** 配布ファイルを取得して JSON として返す */
  async function fetchJson(path: string): Promise<unknown> {
    const data = await BytesData.fromURL(`${dirUrl}/${path}`);
    if (isError(data)) throw new Error(`failed to fetch ${path}`);
    return JSON.parse(await data.text());
  }

  test.each([
    ['donation.json', DonationResourceV1],
    ['serverProperties.json', ServerPropertiesResourceV1],
  ] as [string, z.ZodType][])(
    '%s がアプリのスキーマを厳格に満たす（不正な要素が1つもない）',
    async (fileName, schema) => {
      const parsed = schema.safeParse(await fetchJson(fileName));
      expect(parsed.error?.issues).toBeUndefined();
    }
  );

  test('寄付サービスのアイコンをすべて取得できる', async () => {
    const { services } = DonationResourceV1.parse(
      await fetchJson('donation.json')
    );
    for (const { icon } of services) {
      if (icon === undefined || icon.startsWith('data:')) continue;
      const data = await BytesData.fromURL(
        new URL(icon, `${dirUrl}/donation.json`).href
      );
      expect(isError(data), icon).toBe(false);
    }
  });

  test.each(Object.entries(generateJsonSchemas()))(
    '配布元の %s がアプリのスキーマと一致する',
    async (fileName, schema) => {
      expect(await fetchJson(`schema/${fileName}`)).toEqual(schema);
    }
  );
});
