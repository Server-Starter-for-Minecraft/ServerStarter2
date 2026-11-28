// Vitest は `src/` のエイリアスを持たないため，テストからも読み込めるよう `app/` 経由で参照する
import type {
  DonationResource,
  DonationService,
} from 'app/src-electron/schema/outerResource/donation';

/**
 * 寄付ダイアログに表示する寄付サービスを返す
 *
 * 寄付サービスの一覧は外部リソース（OuterResources の `donation.json`）で管理しており，
 * アプリを更新せずにサービスの追加・並べ替え・文言やリンク先の変更ができる
 *
 * @param resource 外部リソースの寄付サービスの一覧（読み込み前は `undefined`）
 * @returns 表示する（受付中の）寄付サービス（外部リソースでの並び順）
 */
export function getVisibleDonationServices(
  resource: DonationResource | undefined
): DonationService[] {
  return (resource?.services ?? []).filter((service) => service.visible);
}
