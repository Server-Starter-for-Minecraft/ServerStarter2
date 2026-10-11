import { describe, expect, test } from 'vitest';
import { enUSMainLayout } from '../../../i18n/en-US/Pages/mainLayout';
import { jaMainLayout } from '../../../i18n/ja/Pages/mainLayout';
import { donationOptions, formatYen } from './donationOptions';

/**
 * 寄付ダイアログの選択肢が，正しく表示・遷移できる定義になっていることを確認する
 */
describe('寄付の選択肢', () => {
  test('選択肢の識別子が重複していない', () => {
    const ids = donationOptions.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test.each(donationOptions)('$id の寄付ページは https の URL である', (o) => {
    expect(new URL(o.url).protocol).toBe('https:');
  });

  test.each(donationOptions.filter((o) => o.amount !== void 0))(
    '$id の金額は正の整数（円）である',
    (o) => {
      expect(Number.isInteger(o.amount)).toBe(true);
      expect(o.amount).toBeGreaterThan(0);
    }
  );

  test.each(donationOptions)('$id に日本語と英語の説明文がある', ({ id }) => {
    const nonEmpty = expect.stringMatching(/\S/);
    for (const locale of [jaMainLayout, enUSMainLayout]) {
      expect(locale.donation.options).toHaveProperty([id, 'desc'], nonEmpty);
    }
  });

  // 金額を指定しない選択肢は金額の代わりに見出しの文言を表示するため，見出しが必要
  test.each(donationOptions.filter((o) => o.amount === void 0))(
    '$id に日本語と英語の見出しがある',
    ({ id }) => {
      const nonEmpty = expect.stringMatching(/\S/);
      for (const locale of [jaMainLayout, enUSMainLayout]) {
        expect(locale.donation.options).toHaveProperty([id, 'title'], nonEmpty);
      }
    }
  );
});

describe('formatYen', () => {
  test('円記号と3桁区切りを付けて表示する', () => {
    expect(formatYen(500)).toBe('¥500');
    expect(formatYen(1000)).toBe('¥1,000');
    expect(formatYen(1234567)).toBe('¥1,234,567');
  });
});
