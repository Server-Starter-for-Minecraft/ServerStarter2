import { Fixer, fail } from './fixer';

export const String = new Fixer<string, true>((value, path) =>
  typeof value === 'string' ? value : fail([path])
);

export const Number = new Fixer<number, true>((value, path) =>
  typeof value === 'number' ? value : fail([path])
);

export const Bigint = new Fixer<bigint, true>((value, path) =>
  typeof value === 'bigint' ? value : fail([path])
);

export const Boolean = new Fixer<boolean, true>((value, path) =>
  typeof value === 'boolean' ? value : fail([path])
);

export const Null = new Fixer<null, true>((value, path) =>
  typeof value === null ? value : fail([path])
);
