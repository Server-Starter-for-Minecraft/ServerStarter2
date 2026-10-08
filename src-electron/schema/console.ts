import { z } from 'zod';

/**
 * サーバーのコンソールへの1回分の出力
 *
 * GUIでは出力ごとに行間を空けて表示するため、ログにも出力の単位で記録して表示を再現する
 */
export const ConsoleOutput = z.object({
  /** 出力された文字列（ANSIエスケープシーケンスや改行を含む） */
  text: z.string(),
  /** 標準エラー出力か */
  isError: z.boolean(),
});
export type ConsoleOutput = z.infer<typeof ConsoleOutput>;
