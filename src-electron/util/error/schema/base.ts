export const errorMessageContentSyembol = Symbol();
export type ErrorMessageContentSyembol = typeof errorMessageContentSyembol;

export type ErrorMessageContent<
  T extends object | any[] | undefined = undefined
> = () => T;

export interface Errors {
  [K: string]: Errors | ErrorMessageContent<any>;
}

type AddSuffix<T, P extends string> = T extends [infer U, infer V]
  ? U extends string
    ? [`${P}.${U}`, V]
    : never
  : never;

type FlattenErrorKV<
  T extends Record<string, unknown>,
  Key = keyof T
> = Key extends string
  ? T[Key] extends Record<string, unknown>
    ? AddSuffix<FlattenErrorKV<T[Key]>, Key>
    : T[Key] extends () => infer R
    ? [`${Key}`, R]
    : never
  : never;

type TupleToObject<T> = T extends [infer K, infer V]
  ? K extends string
    ? { [P in K]: V }
    : never
  : never;

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

type Merge<T> = {
  [K in keyof T]: T[K];
};

export type FlattenErrors<T extends Errors> = Merge<
  UnionToIntersection<TupleToObject<FlattenErrorKV<T>>>
>;
