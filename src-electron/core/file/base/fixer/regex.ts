import { fail } from './fixer';
import { fixString } from './primitive';

/** 正規表現にマッチしない場合にfailになる */
export function fixRegex(regex: string | RegExp) {
  fixString.map((x, p) => (x.match(regex) ? x : fail([p])));
}

const UUIDRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export const fixUUID = fixString.map((x, p) => {
  const upper = x.toUpperCase();
  return upper.match(UUIDRegex) ? upper : fail([p]);
});
