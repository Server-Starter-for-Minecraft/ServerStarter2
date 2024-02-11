import { fail } from './fixer';
import { fixString } from './primitive';

/** 正規表現にマッチしない場合にfailになる */
export function fixRegex(regex: string | RegExp) {
  fixString.map((x, p) => (x.match(regex) ? x : fail([p])));
}
