import { ServerPropertiesAnnotation } from './serverproperty';

export type MinecraftColors = {
  dark_red: string;
  red: string;
  gold: string;
  yellow: string;
  dark_green: string;
  green: string;
  aqua: string;
  dark_aqua: string;
  dark_blue: string;
  blue: string;
  light_purple: string;
  dark_purple: string;
  white: string;
  gray: string;
  dark_gray: string;
  black: string;
};

export type StaticResouce = {
  properties: ServerPropertiesAnnotation;
  minecraftColors: MinecraftColors;
};
