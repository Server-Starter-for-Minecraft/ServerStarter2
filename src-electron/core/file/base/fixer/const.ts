import { Fixer, fail } from './fixer';

export function Const<T>(...values: T[]): Fixer<T, true> {
  const set = new Set(values);
  const f = (value: any, path: string) =>
    set.has(value) ? value : fail([path]);
  return new Fixer(f);
}
