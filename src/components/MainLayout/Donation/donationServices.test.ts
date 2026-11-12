import { describe, expect, test } from 'vitest';
import { enUSMainLayout } from '../../../i18n/en-US/Pages/mainLayout';
import { jaMainLayout } from '../../../i18n/ja/Pages/mainLayout';
import { donationServices, getDonationPageUrl } from './donationServices';

/**
 * 寄付ダイアログの寄付サービスが，正しく表示・遷移できる定義になっていることを確認する
 */
describe('寄付サービス', () => {
  test('サービスの識別子が重複していない', () => {
    const ids = donationServices.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('寄付ダイアログに表示されるサービスが1つ以上ある', () => {
    expect(donationServices.some((s) => s.visible)).toBe(true);
  });

  test.each(donationServices)(
    '$id の寄付ページは公式ホームページの https の URL である',
    (s) => {
      const url = new URL(getDonationPageUrl(s));
      expect(url.protocol).toBe('https:');
      expect(url.hostname).toBe('server-starter-for-minecraft.github.io');
    }
  );

  // ホームページ側は service の値からリダイレクト先を選ぶため，サービスの識別子がそのまま渡る必要がある
  test.each(donationServices)('$id の寄付ページにサービスが渡される', (s) => {
    const url = new URL(getDonationPageUrl(s));
    expect(url.searchParams.getAll('service')).toEqual([s.id]);
  });

  test.each(donationServices)(
    '$id にサービス名と日本語・英語の説明文がある',
    ({ id, name }) => {
      const nonEmpty = expect.stringMatching(/\S/);
      expect(name).toEqual(nonEmpty);
      for (const locale of [jaMainLayout, enUSMainLayout]) {
        expect(locale.donation.services).toHaveProperty([id, 'desc'], nonEmpty);
      }
    }
  );
});
