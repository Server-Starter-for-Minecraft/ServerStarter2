import { describe, expect, test } from 'vitest';
import { DonationResourceV1 } from 'app/src-electron/schema/outerResource/donation';
import { ServerPropertiesResourceV1 } from 'app/src-electron/schema/outerResource/serverProperties';
import { buildInitialDistribution } from './initialDistribution';

describe('配布ファイルの初期データ', () => {
  const { files, images } = buildInitialDistribution();

  test('配布ファイルのスキーマを満たす', () => {
    expect(
      DonationResourceV1.safeParse(files['v1/donation.json']).success
    ).toBe(true);
    expect(
      ServerPropertiesResourceV1.safeParse(files['v1/serverProperties.json'])
        .success
    ).toBe(true);
  });

  test('寄付サービスのアイコンは画像ファイルとして書き出す', () => {
    const { services } = DonationResourceV1.parse(files['v1/donation.json']);
    for (const { icon } of services) {
      if (icon === undefined) continue;
      expect(icon).not.toMatch(/^data:/);
      expect(images[`v1/${icon}`]?.length).toBeGreaterThan(0);
    }
  });
});
