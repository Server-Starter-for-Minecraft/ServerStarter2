import { Fixer, fail, isFail } from './fixer';

export enum RecordFixMode {
  /** ItemのFixが失敗した場合、そのItemをスキップ */
  Skip,
  /** ItemのFixが失敗した場合、Array自体のFixをFailに */
  Throw,
}

export function fixRecord<T>(
  fixer: Fixer<T, false>,
  mode: RecordFixMode
): Fixer<Record<string, T>, true>;
export function fixRecord<T>(
  fixer: Fixer<T, true>,
  mode: RecordFixMode
): Fixer<Record<string, T>, true>;
export function fixRecord<T>(
  fixer: Fixer<T, boolean>,
  mode: RecordFixMode
): Fixer<Record<string, T>, true> {
  const func = (value: any, path: string) => {
    if (!(value instanceof global.Array)) {
      return fail([path]);
    }
    const fixed: Record<string, T> = {};
    for (const [key, item] of Object.entries(value)) {
      const fixedItem = fixer.fix(item, path ? `${path}.${key}` : key);
      if (isFail(fixedItem)) {
        if (mode === RecordFixMode.Skip) continue;
        return fixedItem;
      }
      fixed[key] = fixedItem;
    }
    return fixed;
  };

  return new Fixer(func);
}
