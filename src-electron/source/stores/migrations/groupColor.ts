import { RawSettings } from 'app/src-electron/util/versioning/versionedSchema';
import { MinecraftColors } from '../../../schema/static';

/**
 * 以前のグループの配色（Minecraftのチャットの16色）と、その色のグループに表示していた染料・羊毛の対応
 *
 * 以前はチャットの色コードを保存し、表示する際にこの対応で染料・羊毛の画像を選んでいた
 */
const LEGACY_COLOR_TO_DYE: Record<string, keyof MinecraftColors> = {
  '#AA0000': 'red',
  '#FF5555': 'pink',
  '#FFAA00': 'orange',
  '#FFFF55': 'yellow',
  '#00AA00': 'green',
  '#55FF55': 'lime',
  '#55FFFF': 'light_blue',
  '#00AAAA': 'cyan',
  '#0000AA': 'blue',
  '#5555FF': 'brown',
  '#FF55FF': 'magenta',
  '#AA00AA': 'purple',
  '#FFFFFF': 'white',
  '#AAAAAA': 'light_gray',
  '#555555': 'gray',
  '#000000': 'black',
};

/**
 * プレイヤーグループの色を、チャットの16色の色コードから染料の色コードに変換する
 *
 * 変換後も以前と同じ染料・羊毛の画像が表示されるよう、表示していた染料の色に置き換える。
 * 以前の16色に含まれない色コードは、以前の表示と同じく白とする。
 *
 * @param data システム設定ファイルの内容（変換前のバージョン）
 * @returns プレイヤーグループの色を変換した内容
 */
export function migrateGroupColorToDye(data: RawSettings): RawSettings {
  const player = data.player as
    { groups?: Record<string, unknown> } | undefined;
  if (typeof player?.groups !== 'object' || player.groups === null) return data;

  const dyeColors = MinecraftColors.parse({});
  const groups = Object.fromEntries(
    Object.entries(player.groups).map(([name, group]) => {
      if (typeof group !== 'object' || group === null) return [name, group];
      const color = (group as { color?: unknown }).color;
      const legacy = typeof color === 'string' ? color.toUpperCase() : '';
      const dye = LEGACY_COLOR_TO_DYE[legacy] ?? 'white';
      return [name, { ...group, color: dyeColors[dye] }];
    })
  );
  return { ...data, player: { ...player, groups } };
}
