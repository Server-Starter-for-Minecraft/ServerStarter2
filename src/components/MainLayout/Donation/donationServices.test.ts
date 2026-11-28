import { describe, expect, test } from 'vitest';
import type {
  DonationResource,
  DonationService,
} from 'app/src-electron/schema/outerResource/donation';
import { getVisibleDonationServices } from './donationServices';

/** テスト用の寄付サービス */
function service(id: string, visible: boolean): DonationService {
  return {
    id,
    name: id,
    url: `https://example.com/${id}`,
    color: '#000000',
    description: { ja: id },
    visible,
  };
}

describe('寄付ダイアログに表示する寄付サービス', () => {
  test('受付中のサービスだけを外部リソースでの並び順で表示する', () => {
    const resource: DonationResource = {
      services: [
        service('b', true),
        service('hidden', false),
        service('a', true),
      ],
    };
    expect(getVisibleDonationServices(resource).map((s) => s.id)).toEqual([
      'b',
      'a',
    ]);
  });

  test('外部リソースの読み込み前は何も表示しない', () => {
    expect(getVisibleDonationServices(undefined)).toEqual([]);
  });
});
