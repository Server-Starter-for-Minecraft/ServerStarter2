const __phantom__ = Symbol();

export type NewType<T, D extends string> = T & {
  [__phantom__]: D;
};
