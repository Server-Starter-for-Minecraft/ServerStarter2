import { stripVTControlCharacters } from 'util';

/** 文字列から ANSI escape code を削除する */
export function trimAnsi(string: string) {
  stripVTControlCharacters(string);
}
