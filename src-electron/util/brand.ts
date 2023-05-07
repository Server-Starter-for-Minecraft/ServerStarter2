export type Brand<T, B extends string> = T & { [K in B as `__${K}__`]: B };
