import { z } from 'zod';

/** Ngrokの設定 */
export const NgrokSetting = z
  .object({
    use_ngrok: z.boolean().default(false),
    remote_addr: z.string().optional(),
  })
  .prefault({});
export type NgrokSetting = z.infer<typeof NgrokSetting>;

/**
 * ワールドの起動時にNgrok（ポート開放不要化）を利用するか否かを判定する
 *
 * バックエンドの起動処理とフロントエンドの表示で判定を揃えるため，必ずこの関数を利用する
 *
 * @param world 対象のワールド（Ngrokの利用設定を参照する）
 * @param ngrokToken システム設定に登録されたNgrokのトークン（未登録の場合はNgrokを利用しない）
 * @returns Ngrokを利用する場合はtrue（このときngrokTokenは空でない文字列）
 */
export function isNgrokEnabled(
  world: { ngrok_setting: NgrokSetting },
  ngrokToken: string | undefined
): ngrokToken is string {
  return !!ngrokToken && world.ngrok_setting.use_ngrok;
}
