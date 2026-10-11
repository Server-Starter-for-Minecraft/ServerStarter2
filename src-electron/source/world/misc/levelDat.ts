import { z } from 'zod';

/**
 * level.dat の Data タグのうち，ServerStarterで使用する値のスキーマ
 *
 * NBTを simplify した値は Long が独自のオブジェクト，Byte(真偽値) が 0/1 の数値になるため，
 * 扱いやすい型へ変換して返す
 */
const LevelDatData = z.object({
  /** ワールド名 */
  LevelName: z.string(),
  Version: z.object({
    //  Id:バージョンの識別子。
    /** 文字列でのバージョン名 */
    Name: z.string(),
    //  Snapshot: 1または0 (true/false) - バージョンがスナップショットであったかどうか
  }),
  /**
   * レベルが最後にロードされたUnix時間(ミリ秒)
   *
   * prismarine-nbt では Long が独自のオブジェクト([上位, 下位]の配列にvalueOfを持たせたもの)となるため，
   * Number() で変換できることのみを検証する
   */
  LastPlayed: z.unknown().transform(Number).pipe(z.number()),
  /** ハードコアかどうか (NBT上は 0/1 のByte) */
  hardcore: z
    .union([z.number(), z.boolean()])
    .transform(Boolean)
    .default(false),
  /** ゲームモード 0はサバイバル, 1はクリエイティブ, 2はアドベンチャー, 3はスペクテイター */
  GameType: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  /** 難易度 0はピースフル、1はイージー、2はノーマル、3はハード */
  Difficulty: z
    .union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)])
    .default(2),
});

/** level.dat の内容のうち，ServerStarterで使用する値のスキーマ */
export const LevelDat = z.object({
  Data: LevelDatData,
});
export type LevelDat = z.infer<typeof LevelDat>;
