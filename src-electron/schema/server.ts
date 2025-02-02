import { z } from 'zod';

/** サーバー開始時にフロントエンドにわたる情報 */
export const ServerStartNotification = z.object({
  /** Ngrokのurl (Ngrokを使用している場合のみ) */
  ngrokURL: z.string().optional(),
  /**
   * 実際に使用したLANのport番号
   * Ngrokを使用するとプロパティのポートとは異なる番号が使われるため
   */
  port: z.number(),
});
export type ServerStartNotification = z.infer<typeof ServerStartNotification>;
