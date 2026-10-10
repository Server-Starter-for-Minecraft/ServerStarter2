import type { MessageSchema } from 'src/boot/i18n';

/**
 * 選択肢の識別子（i18n の `mainLayout.donation.options` に文言が定義されているもの）
 */
type DonationOptionId =
  keyof MessageSchema['mainLayout']['donation']['options'];

/**
 * 寄付ダイアログに表示する寄付の選択肢
 *
 * 選択肢ごとに作成済みの Square リンク決済のページを開く
 */
export interface DonationOption {
  /** 選択肢の識別子（i18n の `mainLayout.donation.options.{id}` の参照にも使う） */
  id: DonationOptionId;
  /**
   * 寄付金額（円）。未指定の場合は寄付者が決済ページで金額を入力する
   *
   * 金額を指定した選択肢は金額を，未指定の選択肢は i18n の `title` を見出しとして表示する
   */
  amount?: number;
  /** カードに表示するアイコン（Material Icons の名前） */
  icon: string;
  /** 寄付ページ（Square リンク決済）の URL */
  url: string;
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
    url: 'https://square.link/u/TODO_500',
  },
  {
    id: 'medium',
    amount: 1000,
    icon: 'lunch_dining',
    url: 'https://square.link/u/TODO_1000',
  },
  {
    id: 'large',
    amount: 2000,
    icon: 'celebration',
    url: 'https://square.link/u/TODO_2000',
  },
  {
    id: 'custom',
    icon: 'edit',
    url: 'https://square.link/u/TODO_CUSTOM',
  },
];

/**
 * 寄付金額を表示用の文字列（例：`¥1,000`）に変換する
 *
 * @param amount 寄付金額（円）
 * @returns 円記号と桁区切りを付けた金額
 */
export function formatYen(amount: number): string {
  return `¥${amount.toLocaleString('ja-JP')}`;
}
