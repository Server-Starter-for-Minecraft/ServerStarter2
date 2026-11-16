import {
  DonationResource,
  DonationResourceV1,
  DonationResourceV1Parser,
  DonationService,
} from 'app/src-electron/schema/outerResource/donation';
import { isValid } from 'app/src-electron/util/error/error';
import type { OuterResourceDefinition } from '../definition';
import { OFUSE_ICON } from './bundledImages';

/**
 * 同梱の寄付サービスの一覧（配布元から取得できず，キャッシュもない場合に表示する）
 *
 * 配布元（OuterResources の `serverstarter2/v1/donation.json`）の内容に合わせておく
 */
export const bundledDonation: DonationResourceV1 = {
  services: [
    {
      id: 'ofuse',
      name: 'OFUSE',
      url: 'https://ofuse.me/civiltt/letter',
      icon: OFUSE_ICON,
      // OFUSE KIT（https://ofuse.me/kit/about）のブランドカラー（OFUSE BLUE）
      color: '#2882A7',
      description: {
        ja: 'お好きな金額で，メッセージを添えて応援できます',
        'en-US': 'Donate any amount you like, along with a message',
      },
      visible: true,
    },
    {
      id: 'githubSponsors',
      name: 'GitHub Sponsors',
      url: 'https://github.com/sponsors/CivilTT',
      color: '#BF3989',
      description: {
        ja: 'GitHubアカウントで，毎月または1回限りの応援ができます',
        'en-US': 'Sponsor us monthly or once with your GitHub account',
      },
      visible: false,
    },
  ],
};

/**
 * 寄付サービスの一覧の外部リソース定義
 *
 * アイコンは画像データ（data URI）に解決してからフロントエンドへ渡す。
 * アイコンを読み込めないサービスは，アイコンなしで表示する
 */
export const donationDefinition: OuterResourceDefinition<
  DonationResourceV1,
  DonationResource
> = {
  key: 'donation',
  schemaVersion: 1,
  fileName: 'donation.json',
  schema: DonationResourceV1,
  parser: DonationResourceV1Parser,
  bundled: bundledDonation,
  async resolve(wire, ctx) {
    const services = await Promise.all(
      wire.services.map(async ({ icon, ...service }) => {
        const resolved: DonationService = { ...service };
        if (icon !== undefined) {
          const image = await ctx.loadImage(icon);
          if (isValid(image)) resolved.icon = image;
        }
        return resolved;
      })
    );
    return { services };
  },
};
