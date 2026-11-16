import { describe, expect, test } from 'vitest';
import { DonationResourceV1 } from 'app/src-electron/schema/outerResource/donation';
import { locales } from 'app/src-electron/schema/system';
import { Path } from 'app/src-electron/util/binary/path';
import { genUUID } from 'app/src-electron/util/random/uuid';
import { OuterResource } from '../loader';
import { bundledDonation, donationDefinition } from './donation';

/**
 * 同梱の寄付サービスの一覧は，配布元に到達できない初回起動時に表示されるため，
 * 配布ファイルとして正しく，そのまま寄付ダイアログに表示できる内容であることを確認する
 */
describe('同梱の寄付サービス', () => {
  const { services } = bundledDonation;

  test('配布ファイルのスキーマを満たす', () => {
    expect(DonationResourceV1.safeParse(bundledDonation).success).toBe(true);
  });

  test('識別子が重複していない', () => {
    const ids = services.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('寄付ダイアログに表示されるサービスが1つ以上ある', () => {
    expect(services.some((s) => s.visible)).toBe(true);
  });

  test.each(services)('$id にアプリの全言語の説明文がある', (s) => {
    for (const locale of locales) {
      expect(s.description[locale]).toMatch(/\S/);
    }
  });

  test('オフラインでもアイコンを表示できる', async () => {
    const resource = new OuterResource(donationDefinition, {
      baseUrl: 'http://127.0.0.1:9/serverstarter2',
      cacheDir: new Path(__dirname).child('work', 'donation', genUUID()),
    });
    const { services: resolved } = await resource.get();
    const iconOf = (id: string) => resolved.find((s) => s.id === id)?.icon;
    for (const s of services.filter((s) => s.icon !== undefined)) {
      expect(iconOf(s.id)).toMatch(/^data:image\//);
    }
  });
});

describe('寄付サービスの配布ファイルの検証', () => {
  const valid = bundledDonation.services[0];

  test('識別子が重複したサービスは最初のものだけを読み込む', () => {
    const parsed = donationDefinition.parser.safeParse({
      services: [valid, { ...valid, name: 'duplicated' }],
    });
    expect(parsed.success && parsed.data.services).toEqual([valid]);
  });

  test.each([
    ['http の寄付ページ', { url: 'http://example.com' }],
    ['URL でない寄付ページ', { url: 'javascript:alert(1)' }],
    ['形式の異なる文字色', { color: 'red' }],
    ['空の説明文', { description: {} }],
  ])('%s のサービスは読み込まない', (_, patch) => {
    const parsed = donationDefinition.parser.safeParse({
      services: [valid, { ...valid, id: 'invalid', ...patch }],
    });
    expect(parsed.success && parsed.data.services.map((s) => s.id)).toEqual([
      valid.id,
    ]);
  });
});
