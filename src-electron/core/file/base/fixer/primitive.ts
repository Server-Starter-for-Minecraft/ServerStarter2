import { Fixer, fail } from './fixer';

export const String = new Fixer((value, path) =>
  typeof value === 'string' ? value : fail([path])
);

export const Number = new Fixer((value, path) =>
  typeof value === 'number' ? value : fail([path])
);

export const Bigint = new Fixer((value, path) =>
  typeof value === 'bigint' ? value : fail([path])
);

export const Boolean = new Fixer((value, path) =>
  typeof value === 'boolean' ? value : fail([path])
);

export const Null = new Fixer((value, path) =>
  typeof value === null ? value : fail([path])
);
