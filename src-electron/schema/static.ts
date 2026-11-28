import { z } from 'zod';

/**
 * プレイヤーグループの配色に用いるMinecraftの染料の16色（キーは染料・羊毛の画像の名前と一致する）
 *
 * 色コードはMinecraftの染料の色（DyeColor）に合わせる。並び順はクリエイティブインベントリの順とする
 */
export const MinecraftColors = z
  .object({
    white: z.string().default('#F9FFFE'),
    light_gray: z.string().default('#9D9D97'),
    gray: z.string().default('#474F52'),
    black: z.string().default('#1D1D21'),
    brown: z.string().default('#835432'),
    red: z.string().default('#B02E26'),
    orange: z.string().default('#F9801D'),
    yellow: z.string().default('#FED83D'),
    lime: z.string().default('#80C71F'),
    green: z.string().default('#5E7C16'),
    cyan: z.string().default('#169C9C'),
    light_blue: z.string().default('#3AB3DA'),
    blue: z.string().default('#3C44AA'),
    purple: z.string().default('#8932B8'),
    magenta: z.string().default('#C74EBD'),
    pink: z.string().default('#F38BAA'),
  })
  .prefault({});
export type MinecraftColors = z.infer<typeof MinecraftColors>;

/**
 * フロントエンドへ渡す定数
 *
 * サーバープロパティの定義は外部リソース（`OuterResources.serverProperties`）から渡す
 */
export const StaticResouce = z.object({
  minecraftColors: MinecraftColors,
  /**
   * アプリのファイルの保存先
   *
   * 保存先は Electron の実行環境から決まるため，スキーマ（フロントエンドと共有する）では既定値を持たず，
   * バックエンド（source/system/resource.ts）で設定する
   */
  paths: z.object({
    log: z.string(),
    cache: z.object({
      datapack: z.string(),
      plugin: z.string(),
      mod: z.string(),
    }),
  }),
});
export type StaticResouce = z.infer<typeof StaticResouce>;

/**
 * フロントエンドへ渡す定数のうち，保存先（paths）以外の部分
 *
 * スキーマの既定値から作るため，例外を投げることは無い
 */
export const STATIC_RESOURCE_WITHOUT_PATHS: Omit<StaticResouce, 'paths'> =
  StaticResouce.omit({ paths: true }).parse({});
