import { RawSettings } from 'app/src-electron/util/versioning/versionedSchema';

/**
 * 以前のグループの配色（Minecraftのチャットの16色）から、その色のグループに表示していた染料の色への対応
 *
 * 以前はチャットの色コードを保存し、表示する際に染料・羊毛の画像を選んでいた。
 * 変換結果が今後の配色の変更に影響されないよう、変換先はこのバージョン（2）時点の染料の色コードで固定する。
 */
const LEGACY_COLOR_TO_DYE: Record<string, string> = {
  '#AA0000': '#B02E26', // dark_red -> red
  '#FF5555': '#F38BAA', // red -> pink
  '#FFAA00': '#F9801D', // gold -> orange
  '#FFFF55': '#FED83D', // yellow -> yellow
  '#00AA00': '#5E7C16', // dark_green -> green
  '#55FF55': '#80C71F', // green -> lime
  '#55FFFF': '#3AB3DA', // aqua -> light_blue
  '#00AAAA': '#169C9C', // dark_aqua -> cyan
  '#0000AA': '#3C44AA', // dark_blue -> blue
  '#5555FF': '#835432', // blue -> brown
  '#FF55FF': '#C74EBD', // light_purple -> magenta
  '#AA00AA': '#8932B8', // dark_purple -> purple
  '#FFFFFF': '#F9FFFE', // white -> white
  '#AAAAAA': '#9D9D97', // gray -> light_gray
  '#555555': '#474F52', // dark_gray -> gray
  '#000000': '#1D1D21', // black -> black
};

/** 以前の16色に含まれない色の変換先（以前の表示と同じく白） */
const FALLBACK_DYE = '#F9FFFE';

/** 値がオブジェクト（配列を除く）か */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * プレイヤーグループの色を、チャットの16色の色コードから染料の色コードに変換する
 *
 * 変換後も以前と同じ染料・羊毛の画像が表示されるよう、表示していた染料の色に置き換える。
 * 以前の16色に含まれない色コードは、以前の表示と同じく白とする。
 * 想定外の形式の値は変換せずにそのまま残す（検証はスキーマで行う）。
 *
 * @param data システム設定ファイルの内容（バージョン1）
 * @returns プレイヤーグループの色を変換した内容（バージョン2）
 */
export function migrateGroupColorToDye(data: RawSettings): RawSettings {
  const player = data.player;
  if (!isObject(player) || !isObject(player.groups)) return data;

  const groups = Object.fromEntries(
    Object.entries(player.groups).map(([name, group]) => {
      if (!isObject(group)) return [name, group];
      const legacy =
        typeof group.color === 'string' ? group.color.toUpperCase() : '';
      return [
        name,
        { ...group, color: LEGACY_COLOR_TO_DYE[legacy] ?? FALLBACK_DYE },
      ];
    })
  );
  return { ...data, player: { ...player, groups } };
}
