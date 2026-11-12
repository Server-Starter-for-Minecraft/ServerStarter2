// Vitest は `src/` のエイリアスを持たないため，テストからも読み込めるよう `app/` 経由で参照する
import { assets } from 'app/src/assets/assets';
import type { MessageSchema } from 'src/boot/i18n';
import type { ImageURI } from 'app/src-electron/schema/brands';

/**
 * 寄付サービスの識別子（i18n の `mainLayout.donation.services` に文言が定義されているもの）
 *
 * 公式ホームページへ `?service={識別子}` として渡すため，ホームページ側の識別子と一致させる
 */
type DonationServiceId =
  keyof MessageSchema['mainLayout']['donation']['services'];

/**
 * 寄付サービスを指定して寄付ページへ移動する公式ホームページのページの URL
 *
 * 寄付ページ（OFUSE など）の URL はホームページ側で管理しており，
 * クエリパラメータ `service` で指定したサービスの寄付ページへリダイレクトされる。
 * これにより，寄付ページを差し替えてもアプリを更新せずに済む。
 */
const DONATE_PAGE_URL =
  'https://server-starter-for-minecraft.github.io/support/donate';

/**
 * 寄付ダイアログに表示する寄付サービス
 *
 * 選択すると，公式ホームページを経由してサービスの寄付ページを開く
 */
export interface DonationService {
  /** サービスの識別子（i18n の `mainLayout.donation.services.{id}` の参照にも使う） */
  id: DonationServiceId;
  /** サービス名（固有名詞のため翻訳せず，ボタンの文言にも埋め込む） */
  name: string;
  /**
   * サービスのアイコン画像
   *
   * サービスの提供元が配布しているものを加工せずに使う（縦横比を保って表示する）。
   * 未定義の場合はアイコンを表示しない
   */
  icon?: ImageURI;
  /** サービス名の文字色（サービスのブランドカラー） */
  color: string;
  /**
   * 寄付ダイアログに表示するか
   *
   * 準備中のサービスは `false` にしておき，受付を開始したら `true` にする
   */
  visible: boolean;
}

/**
 * 寄付サービスの一覧（表示順）
 *
 * サービスを追加・変更する場合はこの配列と i18n の説明文（アイコンを使う場合は assets の画像）のみを変更すればよい
 * （ホームページ側にも同じ識別子のサービスが定義されている必要がある）
 */
export const donationServices: readonly DonationService[] = [
  {
    id: 'ofuse',
    name: 'OFUSE',
    // OFUSE KIT（https://ofuse.me/kit/about）の公式アイコンとブランドカラー（OFUSE BLUE）
    icon: assets.png.ofuse_icon,
    color: '#2882A7',
    visible: true,
  },
  {
    // 受付開始までは非表示にしておく（公開時に公式アイコンを assets に追加して icon に設定する）
    id: 'githubSponsors',
    name: 'GitHub Sponsors',
    color: '#BF3989',
    visible: false,
  },
];

/**
 * 寄付サービスの寄付ページ（公式ホームページ経由でサービスのページへ移動する URL）を返す
 *
 * @param service 寄付サービス
 * @returns `?service={識別子}` 付きの公式ホームページの URL
 */
export function getDonationPageUrl(service: DonationService): string {
  const url = new URL(DONATE_PAGE_URL);
  url.searchParams.set('service', service.id);
  return url.toString();
}
