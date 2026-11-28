import {
  DonationResource,
  DonationResourceV1,
  DonationResourceV1Parser,
  DonationService,
} from 'app/src-electron/schema/outerResource/donation';
import { isError, isValid } from 'app/src-electron/util/error/error';
import { ignoreError } from 'app/src-electron/util/error/ignore';
import bundledJson from '../bundled/v1/donation.json';
import type { OuterResourceDefinition } from '../definition';

/**
 * 同梱の寄付サービスの一覧（配布元から取得できず，キャッシュもない場合に表示する）
 *
 * リリース時のビルドで配布元の最新の内容に更新される（`bun run outer-resources pull`）。
 * 同梱データの正しさはテストで厳格に検証しているため，ここでは読み込めない場合にサービスなしとする
 */
const bundledDonation: DonationResourceV1 = DonationResourceV1Parser.safeParse(
  bundledJson
).data ?? { services: [] };

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
  async embedAssets(wire, loadImage) {
    const services = await Promise.all(
      wire.services.map(async (service) => {
        if (service.icon === undefined) return service;
        const icon = await loadImage(service.icon);
        return isError(icon) ? icon : { ...service, icon };
      })
    );
    const error = services.find(isError);
    return error ?? { services: services.filter(isValid) };
  },
  async resolve(wire, ctx) {
    const services = await Promise.all(
      wire.services.map(async ({ icon, ...service }) => {
        const resolved: DonationService = { ...service };
        if (icon !== undefined) {
          const image = await ctx.loadImage(icon);
          // 起動直後（画像を取得する前）はキャッシュに無いこともあるため，アイコンなしで表示する
          // （取得の失敗は取得処理のログに残る）
          resolved.icon = isValid(image)
            ? image
            : ignoreError(
                image,
                'アイコンを読み込めないサービスはアイコンなしで表示する'
              );
        }
        return resolved;
      })
    );
    return { services };
  },
};
