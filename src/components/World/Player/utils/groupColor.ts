import { keys, values } from 'app/src-public/scripts/obj/obj';
import { MinecraftColors } from 'app/src-electron/schema/static';

// TODO: 変換コードをバックエンドに移築
export const old2newKey = {
  dark_red: 'red',
  red: 'pink',
  gold: 'orange',
  yellow: 'yellow',
  dark_green: 'green',
  green: 'lime',
  aqua: 'light_blue',
  dark_aqua: 'cyan',
  dark_blue: 'blue',
  blue: 'brown',
  light_purple: 'magenta',
  dark_purple: 'purple',
  white: 'white',
  gray: 'light_gray',
  dark_gray: 'gray',
  black: 'black',
} as const;

export const getColorLabel = (label2code: MinecraftColors, color: string) => {
  const oldKey = keys(label2code)[values(label2code).indexOf(color)];
  return old2newKey[oldKey];
};
