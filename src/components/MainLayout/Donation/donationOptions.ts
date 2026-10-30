import type { MessageSchema } from 'src/boot/i18n';

/**
 * 選択肢の識別子（i18n の `mainLayout.donation.options` に文言が定義されているもの）
 */
type DonationOptionId =
  keyof MessageSchema['mainLayout']['donation']['options'];

/**
 * 寄付金額を指定して決済ページへ移動する公式ホームページのページの URL
 *
 * 決済ページ（Square リンク決済）の URL はホームページ側で管理しており，
 * クエリパラメータ `amount` で指定した金額に対応する決済ページへリダイレクトされる。
 * これにより，決済ページを差し替えてもアプリを更新せずに済む。
 */
const DONATE_PAGE_URL =
  'https://server-starter-for-minecraft.github.io/support/donate';

/**
 * 寄付ダイアログに表示する寄付の選択肢
 *
 * 選択すると，公式ホームページを経由して金額に対応する決済ページを開く
 */
export interface DonationOption {
  /** 選択肢の識別子（i18n の `mainLayout.donation.options.{id}` の参照にも使う） */
  id: DonationOptionId;
  /**
   * 寄付金額（円）。未指定の場合は寄付者が決済ページで金額を入力する
   *
   * 金額を指定した選択肢は金額を，未指定の選択肢は i18n の `title` を見出しとして表示する。
   * ホームページ側にも同じ金額の選択肢が定義されている必要がある（ない場合はホームページの応援ページが開く）
   */
  amount?: number;
  /** カードに表示するアイコン（Material Icons の名前） */
  icon: string;
}

/**
 * 寄付の選択肢の一覧（表示順）
 *
 * 選択肢を追加・変更する場合はこの配列と i18n の文言のみを変更すればよい
 */
export const donationOptions: readonly DonationOption[] = [
  {
    id: 'small',
    amount: 500,
    icon: 'local_cafe',
  },
  {
    id: 'medium',
    amount: 1000,
    icon: 'lunch_dining',
  },
  {
    id: 'large',
    amount: 2000,
    icon: 'celebration',
  },
  {
    id: 'custom',
    icon: 'edit',
  },
];

/**
 * 寄付の選択肢に対応する寄付ページ（公式ホームページ経由で決済ページへ移動する URL）を返す
 *
 * @param option 寄付の選択肢
 * @returns 金額を指定した選択肢は `?amount={金額}` 付きの，未指定の選択肢はクエリなしの URL
 */
export function getDonationPageUrl(option: DonationOption): string {
  const url = new URL(DONATE_PAGE_URL);
  if (option.amount !== void 0) {
    url.searchParams.set('amount', String(option.amount));
  }
  return url.toString();
}

/**
 * 寄付金額を表示用の文字列（例：`¥1,000`）に変換する
 *
 * @param amount 寄付金額（円）
 * @returns 円記号と桁区切りを付けた金額
 */
export function formatYen(amount: number): string {
  return `¥${amount.toLocaleString('ja-JP')}`;
}
