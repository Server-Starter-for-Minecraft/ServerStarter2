import { Fixer, fail, isFail } from './fixer';

export enum ArrayFixMode {
  /** ItemのFixが失敗した場合、そのItemをスキップ */
  Skip,
  /** ItemのFixが失敗した場合、Array自体のFixをFailに */
  Throw,
}

export function fixArray<T>(
  fixer: Fixer<T, false>,
  mode: ArrayFixMode
): Fixer<T[], true>;
export function fixArray<T>(
  fixer: Fixer<T, true>,
  mode: ArrayFixMode
): Fixer<T[], true>;
export function fixArray<T>(
  fixer: Fixer<T, boolean>,
  mode: ArrayFixMode
): Fixer<T[], true> {
  const func = (value: any, path: string) => {
    if (!(value instanceof global.Array)) {
      return fail([path]);
    }
    const fixed: T[] = [];
    for (const item of value) {
      const fixedItem = fixer.fix(item, path);
      if (isFail(fixedItem)) {
        if (mode === ArrayFixMode.Skip) continue;
        return fixedItem;
      }
      fixed.push(fixedItem);
    }
    return fixed;
  };

  return new Fixer(func);
}
