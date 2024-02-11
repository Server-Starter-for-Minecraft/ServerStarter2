import { Fixer, fail } from './fixer';

export const fixString = new Fixer<string, true>((value, path) =>
  typeof value === 'string' ? value : fail([path])
);

export const fixNumber = new Fixer<number, true>((value, path) =>
  typeof value === 'number' ? value : fail([path])
);

export const fixBigint = new Fixer<bigint, true>((value, path) =>
  typeof value === 'bigint' ? value : fail([path])
);

export const fixBoolean = new Fixer<boolean, true>((value, path) =>
  typeof value === 'boolean' ? value : fail([path])
);

export const fixNull = new Fixer<null, true>((value, path) =>
  typeof value === null ? value : fail([path])
);
